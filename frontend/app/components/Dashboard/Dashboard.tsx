"use client";

import { aiTools } from "@/app/constants";
import '../../../public/styles/Dashboard.css'

type DashboardProps = {
  onChangeComponent: (componentName: string) => void;
};

const Dashboard = ({ onChangeComponent }: DashboardProps) => {
  return (
    <div>
      <div className="dashHeader">
        <div className="text-xl">Hii, Siddhesh Mhaskar</div>
        {/* <p className="text-sm text-gray-400 pt-1">Welcome back, let's shape some career's today</p> */}
      </div>
      <div className="dashContent flex justify-around items-center gap-2 my-2">
        {aiTools.slice(0, -1).map((item, idx) => {
          return (
            <div key={idx} className="dashTiles center">
              <div className="container">
                <div className="toolTile flex flex-col">
                  <div className="flex center">
                    <img className="icon" src={item.icon} alt={item.tool} />
                    <div className="tool">{item.tool}</div>
                  </div>
                  <div className="desc" title={item.description}>
                    {item.description}
                  </div>
                </div>
                <div className="btn center">
                  <button onClick={() => onChangeComponent(item.cmpName)}>{item.btnText}</button>
                </div>
              </div>
            </div>
          )
        })}
      </div>
      <div className="dashSubContent"></div>
      <div className="dashFootContent mt-2"></div>
    </div>
  );
};

export default Dashboard;