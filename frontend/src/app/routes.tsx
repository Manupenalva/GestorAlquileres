import { createBrowserRouter } from "react-router";
import { Root } from "./Root";
import { Home } from "./pages/Home";
import { BuildingDetail } from "./pages/BuildingDetail";
import { MonthlyReport } from "./pages/MonthlyReport";

export const createRouter = (props: any) => createBrowserRouter([
  {
    path: "/",
    element: <Root {...props} />,
    children: [
      { 
        index: true, 
        element: <Home buildings={props.buildings} />
      },
      { 
        path: "building/:id", 
        element: <BuildingDetail {...props} />
      },
      { 
        path: "building/:id/report", 
        element: <MonthlyReport {...props} />
      },
    ],
  },
]);
