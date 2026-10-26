
const prisma = require ("../lib/prisma");

const gameStart = async (req ,res ,next)=>{
    try{ 
      await prisma.$executeRaw`
      DELETE FROM "GameSession" 
      WHERE completed = false AND "startTime" < NOW() - INTERVAL '2 hours'
    `;
    const session = await prisma.gameSession.create({
        data:{startTime:new Date()}
    })
    res.json({sessionId : session.id})
    }catch(err){
        console.error(err);
        next(err)
    }
}

const gameGuess = async (req,res,next)=>{
    try{
        const {sessionId,characterId,coordinates} = req.body

        const target = await prisma.target.findUnique({where:{name:characterId}})
        const session = await prisma.gameSession.findUnique({where:{id:sessionId}})

        if(!target || !session){
            res.status(404).json({error: 'Invalid session or target' })
        }

        const targetIsHit = 
        coordinates.x >= target.minX &&
        coordinates.x <= target.maxX &&
        coordinates.y >= target.minY &&
        coordinates.y <= target.maxY;

        if(!targetIsHit)return res.json({correct:false})

            const exisingHit = await prisma.sessionHit.findUnique({
                where:{sessionId_targetId:{ sessionId,
                                            targetId:target.id
                                        }}
            })


       if(!exisingHit){ 
        try{
             await prisma.sessionHit.create({
                data:{
                    targetId:target.id,
                    sessionId
                }
            })
        }catch(err){
            console.error(err)
            console.log('Character already recorded as found.');
            next(err)
        }}
        const totaltarget = await prisma.target.count()
        const hitsCount = await prisma.sessionHit.count({ where: { sessionId } });
        let timeInSeconds;

        const finished = hitsCount>=totaltarget
                if(finished){
            const endTime = new Date()
            timeInSeconds = Math.floor((endTime - new Date(session.startTime)) / 1000);

            await prisma.gameSession.update({
                where: { id: sessionId },
                data: { completed: true, endTime, timeInSeconds },
            });
        }
        res.json({correct: true, finished, timeInSeconds})
    }catch(err){
        console.error(err);
        next(err)
    }
}

const inputScore = async (req,res,next) => {
    const { name, timeInSeconds}= req.body
    const userId = req.user ? req.user.userId : null; // Safely get logged-in user ID

    if(!name || !timeInSeconds){
       return res.status(404).json({error:'there is no name or time'})
    }
    try {
        await prisma.leaderboard.create({
            data:{
                name : name ? name : 'Anonymous',
                timeInSeconds,
                userId
            }
        })
        res.status(200).json({success: true})
    }catch(err){
        console.error(err)
        next(err)
    }
}

const getLeaderboard = async (req, res, next) => {
    try {
        const userId = req.user?.userId || req.user?.id || null;

        // 1. Fetch top 10 global fastest scores
        const topScores = await prisma.leaderboard.findMany({
            orderBy: { timeInSeconds: 'asc' },
            take: 10,
        });

        let userBest = null;

        // 2. If user is logged in, find their absolute fastest record
        if (userId) {
            userBest = await prisma.leaderboard.findFirst({
                where: { userId },
                orderBy: { timeInSeconds: 'asc' },
            });
        }

        return res.status(200).json({ topScores, userBest });
    } catch (err) {
        console.error(err);
        return next(err);
    }
};
const testing = async (req,res,next) => {
    const user = req.user
    const body = req.body
    const params = req.params

    console.log(body)
    console.log(user)
    console.log(params)
    
}
module.exports = {gameStart,gameGuess,testing,inputScore,getLeaderboard}