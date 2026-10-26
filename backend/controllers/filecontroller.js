const path = require("path");
const { Readable } = require("stream");
const prisma = require("../lib/prisma");
require("dotenv").config();
const { createClient } = require("@supabase/supabase-js");

const supabase = createClient(process.env.SUPABASE_URL, process.env.SUPABASE_KEY);

// One bucket name for upload AND delete (they were different before)
const BUCKET = "Blog_API";

// ---------- helpers ----------

function sanitizeFilename(filename) {
  return filename.replace(/[^a-zA-Z0-9.-]/g, "_").replace(/_{2,}/g, "_");
}

// Turn a Supabase public URL into the path inside the bucket
function getStoragePath(url) {
  const marker = `/${BUCKET}/`;
  const i = url.indexOf(marker);
  if (i === -1) return null;
  return decodeURIComponent(url.slice(i + marker.length).split("?")[0]);
}

function parseId(value) {
  const id = parseInt(value, 10);
  return Number.isNaN(id) ? null : id;
}

// ---------- upload (middleware) ----------

const uploadfile = async (req, res, next) => {
  try {
    const file = req.file;
    if (!file) return next();

    const uniqueName = `${Date.now()}-${sanitizeFilename(file.originalname)}`;

    const { error: uploadError } = await supabase.storage
      .from(BUCKET)
      .upload(uniqueName, file.buffer, {
        contentType: file.mimetype,
        upsert: false,
      });
    if (uploadError) throw uploadError;

    const { data } = supabase.storage.from(BUCKET).getPublicUrl(uniqueName);

    req.savedFileData = {
      name: file.originalname,
      size: file.size,
      url: data.publicUrl,
    };
    next();
  } catch (error) {
    console.error("Upload Error:", error);
    next(error);
  }
};

// ---------- files ----------

// GET /user/file : all files of the logged-in user
const getUserFile = async (req, res, next) => {
  try {
    const files = await prisma.file.findMany({
      where: { userId: req.user.userId },
      orderBy: { uploadTime: "desc" },
    });
    res.status(200).json(files);
  } catch (error) {
    console.error("Get user files error:", error);
    next(error);
  }
};

// GET /files/:id : file details (no password leak: select only safe fields)
const fileinfoGet = async (req, res, next) => {
  try {
    const fileId = parseId(req.params.id);
    if (fileId === null) return res.status(400).json({ message: "Invalid file id" });

    const file = await prisma.file.findUnique({
      where: { id: fileId },
      include: {
        user: { select: { id: true, username: true } },
        folder: true,
      },
    });

    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.userId !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized to view this file" });
    }
    res.json(file);
  } catch (error) {
    next(error);
  }
};

// DELETE /files/:id
const deletefilePost = async (req, res, next) => {
  try {
    const fileId = parseId(req.params.id);
    if (fileId === null) return res.status(400).json({ message: "Invalid file id" });

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.userId !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized to delete this file" });
    }

    const storagePath = getStoragePath(file.url);
    if (storagePath) {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove([storagePath]);
      if (storageError) console.error("Supabase deletion error:", storageError);
    }

    await prisma.file.delete({ where: { id: fileId } });
    res.status(200).json({ message: "File deleted successfully" });
  } catch (error) {
    console.error("Delete File Error:", error);
    next(error);
  }
};

// GET /download/:id
const downloadFileGet = async (req, res, next) => {
  try {
    const fileId = parseId(req.params.id);
    if (fileId === null) return res.status(400).json({ message: "Invalid file id" });

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return res.status(404).json({ message: "File not found" });

    const fileUrl = decodeURIComponent(file.url);
    const extension = path.extname(new URL(fileUrl).pathname);

    let downloadName = file.name;
    if (!downloadName.endsWith(extension)) downloadName += extension;

    const response = await fetch(fileUrl);
    if (!response.ok) {
      return res.status(404).json({ message: "File not found on remote storage" });
    }

    res.setHeader("Content-Type", response.headers.get("content-type") || "application/octet-stream");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename*=UTF-8''${encodeURIComponent(downloadName)}`
    );
    Readable.fromWeb(response.body).pipe(res);
  } catch (error) {
    console.error("Download Error:", error);
    next(error);
  }
};

// PATCH /files/:id/name   body: { name }
const editfilename = async (req, res, next) => {
  try {
    const fileId = parseId(req.params.id);
    const { name } = req.body;
    if (fileId === null || !name?.trim()) {
      return res.status(400).json({ message: "Valid file id and name are required" });
    }

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.userId !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized to edit this file" });
    }

    const updated = await prisma.file.update({
      where: { id: fileId },
      data: { name: name.trim() },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// PATCH /files/:id/move   body: { folderId }  (null = root)
const moveFilePost = async (req, res, next) => {
  try {
    const fileId = parseId(req.params.id);
    if (fileId === null) return res.status(400).json({ message: "Invalid file id" });

    const folderId =
      req.body.folderId === null || req.body.folderId === "" || req.body.folderId === undefined
        ? null
        : parseId(req.body.folderId);

    const file = await prisma.file.findUnique({ where: { id: fileId } });
    if (!file) return res.status(404).json({ message: "File not found" });
    if (file.userId !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized to move this file" });
    }

    if (folderId !== null) {
      const folder = await prisma.folder.findUnique({ where: { id: folderId } });
      if (!folder || folder.userId !== req.user.userId) {
        return res.status(404).json({ message: "Target folder not found" });
      }
    }

    const updated = await prisma.file.update({ where: { id: fileId }, data: { folderId } });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// ---------- folders ----------
// NOTE: Folder.postId must be optional in schema.prisma (Int?) for create to work.

// GET /folders
const getFoldersGet = async (req, res, next) => {
  try {
    const folders = await prisma.folder.findMany({
      where: { userId: req.user.userId },
      orderBy: { createdAt: "desc" },
    });
    res.json(folders);
  } catch (error) {
    next(error);
  }
};

// POST /folders   body: { name }
const createFolderPost = async (req, res, next) => {
  try {
    const name = req.body.name || req.body.foldername;
    if (!name?.trim()) return res.status(400).json({ message: "Folder name is required" });

    const folder = await prisma.folder.create({
      data: { name: name.trim(), userId: req.user.userId },
    });
    res.status(201).json(folder);
  } catch (error) {
    console.error("Create Folder Error:", error);
    next(error);
  }
};

// GET /folders/:id : files inside one folder
const getFolderGet = async (req, res, next) => {
  try {
    const folderId = parseId(req.params.id);
    if (folderId === null) return res.status(400).json({ message: "Invalid folder id" });

    const userId = req.user.userId;
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder || folder.userId !== userId) {
      return res.status(404).json({ message: "Folder not found" });
    }

    const files = await prisma.file.findMany({ where: { folderId, userId } });
    res.json({ folder, files });
  } catch (error) {
    next(error);
  }
};

// PATCH /folders/:id/name   body: { name }
const editfoldernamePost = async (req, res, next) => {
  try {
    const folderId = parseId(req.params.id);
    const name = req.body.name || req.body.editname;
    if (folderId === null || !name?.trim()) {
      return res.status(400).json({ message: "Valid folder id and name are required" });
    }

    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    if (folder.userId !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized to edit this folder" });
    }

    const updated = await prisma.folder.update({
      where: { id: folderId },
      data: { name: name.trim() },
    });
    res.json(updated);
  } catch (error) {
    next(error);
  }
};

// DELETE /folders/:id
const deletefolderPost = async (req, res, next) => {
  try {
    const folderId = parseId(req.params.id);
    if (folderId === null) return res.status(400).json({ message: "Invalid folder id" });

    // was prisma.post before: wrong model
    const folder = await prisma.folder.findUnique({ where: { id: folderId } });
    if (!folder) return res.status(404).json({ message: "Folder not found" });
    if (folder.userId !== req.user.userId) {
      return res.status(403).json({ message: "Unauthorized to delete this folder" });
    }

    const filesInFolder = await prisma.file.findMany({ where: { folderId } });
    const paths = filesInFolder.map((f) => getStoragePath(f.url)).filter(Boolean);

    if (paths.length > 0) {
      const { error: storageError } = await supabase.storage.from(BUCKET).remove(paths);
      if (storageError) console.error("Supabase storage deletion error:", storageError);
    }

    await prisma.file.deleteMany({ where: { folderId } });
    await prisma.folder.delete({ where: { id: folderId } });

    res.json({ message: "Folder deleted successfully" }); // was missing: request hung
  } catch (error) {
    console.error("Delete Folder Error:", error);
    next(error);
  }
};

module.exports = {
  uploadfile,
  getUserFile,
  fileinfoGet,
  deletefilePost,
  downloadFileGet,
  editfilename,
  moveFilePost,
  getFoldersGet,
  createFolderPost,
  getFolderGet,
  editfoldernamePost,
  deletefolderPost,
};