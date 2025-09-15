export default function GridTest() {
  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="grid grid-cols-6 auto-rows-[200px] gap-6">
        {/* Row 1 */}
        <div className="col-span-2 row-span-1 bg-gray-800 rounded-lg flex items-center justify-center text-white">Box 1</div>
        <div className="col-span-2 row-span-3 bg-gray-700 rounded-lg flex items-center justify-center text-white">Chart 1</div>
        <div className="col-span-2 row-span-3 bg-gray-700 rounded-lg flex items-center justify-center text-white">Chart 2</div>

        {/* Row 2 */}
        <div className="col-span-1 row-span-1 bg-gray-800 rounded-lg flex items-center justify-center text-white">Small A</div>
        <div className="col-span-1 row-span-1 bg-gray-800 rounded-lg flex items-center justify-center text-white">Small B</div>

        {/* Row 3 */}
        <div className="col-span-2 row-span-1 bg-gray-800 rounded-lg flex items-center justify-center text-white">Wide Box</div>
        <div className="col-span-1 row-span-1 bg-gray-800 rounded-lg flex items-center justify-center text-white">C</div>
        <div className="col-span-1 row-span-1 bg-gray-800 rounded-lg flex items-center justify-center text-white">D</div>
        <div className="col-span-1 row-span-1 bg-gray-800 rounded-lg flex items-center justify-center text-white">E</div>
        <div className="col-span-1 row-span-1 bg-gray-800 rounded-lg flex items-center justify-center text-white">F</div>
      </div>
    </div>
  );
}
