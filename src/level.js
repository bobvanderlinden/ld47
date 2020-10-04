const { LineSegment } = require("./physics");
const { polygons, checkpoints } = require("./level.json");

const level = [];
for (const path of polygons) {
  let lastPoint = path[path.length - 1];
  for (const point of path) {
    level.push(new LineSegment(lastPoint[0], lastPoint[1], point[0], point[1]));
    lastPoint = point;
  }
}

module.exports = {
  level,
  checkpoints,
};
