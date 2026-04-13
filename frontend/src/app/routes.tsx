import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { Home } from "./pages/Home";
import { BuildingDetail } from "./pages/BuildingDetail";
import { MonthlyReport } from "./pages/MonthlyReport";
import { Login } from "./pages/Login";
import { SignUp } from "./pages/SignUp";
import InquilinoEdificios from "./pages/InquilinoEdificios";

export const createRouter = (props: any) => createBrowserRouter([
  {
    path: "/",
    element: <Root {...props} />,
    children: [
      { 
        index: true, 
        element: <Home buildings={props.buildings} loading={props.buildingsLoading} />
      },
      { 
        path: "building/:id", 
        element: <BuildingDetail {...props} />
      },
      { 
        path: "building/:id/report", 
        element: <MonthlyReport {...props} />
      },
      {
        path: "mis-edificios",
        element: <InquilinoEdificios />
      },
      {
        path: "login",
        element: <Login />
      },
      {
        path: "signup",
        element: <SignUp />
      },
    ],
  },
]);
