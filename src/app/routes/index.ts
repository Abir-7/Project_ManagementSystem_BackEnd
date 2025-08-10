import { Router } from "express";
import { UserRoute } from "../modules/users/user/user.route";
import { AuthRoute } from "../modules/auth/auth.route";
import { UserProfileRoute } from "../modules/users/userProfile/userProfile.route";
import { TeamRoute } from "../modules/team/team.route";
import { ProjectRoute } from "../modules/Projects/project/project.route";

const router = Router();
const apiRoutes = [
  { path: "/user", route: UserRoute },
  { path: "/user", route: UserProfileRoute },
  { path: "/auth", route: AuthRoute },
  { path: "/team", route: TeamRoute },
  { path: "/project", route: ProjectRoute },
];
apiRoutes.forEach((route) => router.use(route.path, route.route));
export default router;
