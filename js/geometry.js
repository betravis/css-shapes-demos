var CircleUtils = {
    intersectBetween: function(cx, cy, r, y1, y2) {
        var boundsMin = cy - r,
            boundsMax = cy + r;

        if (y1 > boundsMax || y2 < boundsMin)
            return null;

        if (y1 <= cy && y2 >= cy)
            return { start: cx - r, end: cx + r };

        var dy = y1 > cy ? y1 - cy : cy - y2,
            dx = Math.sqrt(DistUtils.square(r) - DistUtils.square(dy));
        return { start: cx - dx, end: cx + dx };
    }
}

var PolygonUtils = {
    intersectAt: function(points, y) {
        var p1,
            p2,
            i,
            intersections = [];
        for (i = 0; i < points.length; i++) {
            p1 = points[i];
            p2 = points[(i + 1) % points.length];
            if (p1.y === p2.y) {
                if (p1.y === y) {
                    intersections.push(p1.x);
                    intersections.push(p2.x);
                }
                continue;
            }
            // p = (1 - t) * p1 + t * p2 = p1 + t * (p2 - p1)
            var t = (y - p1.y) / (p2.y - p1.y);
            if (t < 0 || t > 1)
                continue;
            var x = p1.x + t * (p2.x - p1.x);
            intersections.push(x);
        }
        var compare = function(x1, x2) {
            return x1 - x2;
        };
        intersections = intersections.sort(compare);
        if (intersections.length) {
            return { start: intersections[0], end: intersections[intersections.length - 1] };
        }
        return null;
    },
    intersectBetween: function(points, y1, y2) {
        var ys = points.reduce(function(prev, curr) {
            if (curr.y > y1 && curr.y < y2)
                prev.push(curr.y);
            return prev;
        }, [y1, y2]);
        var ranges = ys.map(function(y) {
            return PolygonUtils.intersectAt(points, y);
        });
        var range = ranges.reduce(function(prev, curr) {
            if (!prev)
                return curr;
            if (!curr)
                return prev;
            return { start: Math.min(prev.start, curr.start), end: Math.max(prev.end, curr.end) };
        });
        return range;
    }
}

var DistUtils = {
    // http://stackoverflow.com/questions/849211/shortest-distance-between-a-point-and-a-line-segment
    square: function(x) { return x * x; },
    distanceSquared: function(p1, p2) { return DistUtils.square(p1.x - p2.x) + DistUtils.square(p1.y - p2.y); },
    distanceToSegmentSquared: function(p, start, end) {
        var segmentLengthSquared = DistUtils.distanceSquared(start, end);
        if (segmentLengthSquared === 0)
            return DistUtils.distanceSquared(p, start);
        var t = ((p.x - start.x) * (end.x - start.x) + (p.y - start.y) * (end.y - start.y)) / segmentLengthSquared;
        if (t < 0)
            return DistUtils.distanceSquared(p, start);
        if (t > 1)
            return DistUtils.distanceSquared(p, end);
        return DistUtils.distanceSquared(p, { x: start.x + t * (end.x - start.x),
                                              y: start.y + t * (end.y - start.y) });
    }
}

var ImageUtils = {
    ranges: undefined,
    init: function(src, width, height, callback) {
        var image = new Image();
        image.onload = function() {
            var canvas = document.createElement("canvas");
            canvas.width = width;
            canvas.height = height;
            var g = canvas.getContext("2d");
            g.drawImage(image, 0, 0, width, height);
            var imageData = g.getImageData(0, 0, width, height);
            var min, max;
            var ranges = ImageUtils.ranges = [];
            for (var y = 0; y < height; y++) {
                min = max = -1;
                for (var x = 0; x < width; x++) {
                    if (imageData.data[x * 4 + 3 + y * width * 4] > 0) {
                        max = x;
                        if (min < 0)
                            min = x;
                    }
                }
                if (min >= 0) {
                    ranges.push({ start: min, end: max });
                } else {
                    ranges.push(null);
                }
            }
            callback();
        }
        image.crossOrigin = "anonymous";
        image.width = width;
        image.height = height;
        image.src = src;
    },
    intersectBetween: function(yMin, yMax) {
        var ranges = ImageUtils.ranges;
        // not ready yet
        if (!ranges)
            return null;
        var y, min = -1, max = -1, range;
        for (y = Math.floor(yMin); y <= yMax; y++) {
            // in case range extends beyond image
            if (y < 0 || y > ranges.length)
                continue;
            range = ranges[y];
            if (!range)
                continue;
            if (min < 0) {
                min = range.start;
                max = range.end;
                continue;
            }
            min = Math.min(min, range.start);
            max = Math.max(max, range.end);
        }
        if (min < 0)
            return null;
        return { start: min, end: max };
    }
}
