const Dashboard = () => {
  return (
    <div>
      <div className="dashHeader">
        <div className="text-xl">Hii, Siddhesh Mhaskar</div>
      </div>
      <div className="dashContent flex justify-around items-center gap-2 my-2">
        <div className="dashTiles"></div>
        <div className="dashTiles"></div>
        <div className="dashTiles"></div>
      </div>
      <div className="dashSubContent"></div>
      <div className="dashFootContent mt-2"></div>
    </div>
  );
};

export default Dashboard;
