import ErrorPage from '../ErrorPage';
import Main from '../Maincomponent';
import Leaderboard from '../component/Leaderboard';
import MiddleboardLayout from '../component/Middleboard';
import PhotoTaggingGame from '../component/PhotoTaggingGame';

const routes = [
  {
    path: '/',
    element: <Main />,
    errorElement: <ErrorPage />,
    children: [
      {
  element: <MiddleboardLayout />,
  children: [
    { index: true, element: <PhotoTaggingGame /> }, // Renders by default at root
    { path: 'whereiswaldo', element: <PhotoTaggingGame /> },
    { path: 'leaderboard', element: <Leaderboard /> },
  ],
},,
    ],
  },
];

export default routes;
