class Graphics {
  constructor(canvas) {
    this.canvas = canvas;
    this.context = this.canvas.getContext("2d");
  }

  clear() {
    this.save();
    this.context.setTransform(1, 0, 0, 1, 0, 0);
    this.context.clearRect(0, 0, 9000, 9000);
    this.restore();
  }

  fillCircle(x, y, r, fillStyle = "black") {
    this.context.beginPath();
    this.context.arc(x, y, r, 0, 2 * Math.PI, false);
    this.context.fillStyle = fillStyle;
    this.context.fill();
  }

  strokeLine(a, b, strokeStyle = "black") {
    this.context.beginPath();
    this.context.moveTo(a[0], a[1]);
    this.context.lineTo(b[0], b[1]);
    this.context.strokeStyle = strokeStyle;
    this.context.stroke();
  }

  save() {
    if (!this._depth) {
      this._depth = 0;
    }
    this._depth++;
    this.context.save();
  }

  restore() {
    if (this._depth <= 0) {
      throw new Error("Attempt to restore with stack being 0");
    }
    this.context.restore();
    this._depth--;
  }
}

module.exports = {
  Graphics,
};
