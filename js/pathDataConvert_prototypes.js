
/**
* custom pathData() and setPathData() methods
* browser only
**/

// retrieve pathdata from svg geometry elements
SVGGeometryElement.prototype.getPathDataConverted = function (options = {}) {
    let pathData = [];
    let type = this.nodeName;
    let d, x, y, width, height, r, rx, ry, cx, cy;

    /**
     * bugfix fro chromium
     * ensures we can get the absolute baseVal.values
     */
    if (type !== 'path') {
        css = window.getComputedStyle(this).fill
    }

    switch (type) {
        case 'path':
            d = this.getAttribute("d");
            pathData = parseDtoPathData(d);
            break;

        case 'rect':
            x = this.x.baseVal.value;
            y = this.y.baseVal.value;
            width = this.width.baseVal.value;
            height = this.height.baseVal.value;
            rx = this.rx.baseVal.value;
            ry = this.ry.baseVal.value;

            if (!rx && !ry) {
                pathData = [
                    { type: "M", values: [x, y] },
                    { type: "H", values: [x + width] },
                    { type: "V", values: [y + height] },
                    { type: "H", values: [x] },
                    { type: "Z", values: [] }
                ];
            } else {

                if (rx > width / 2) {
                    rx = width / 2;
                }
                if (ry > height / 2) {
                    ry = height / 2;
                }

                pathData = [
                    { type: "M", values: [x + rx, y] },
                    { type: "H", values: [x + width - rx] },
                    { type: "A", values: [rx, ry, 0, 0, 1, x + width, y + ry] },
                    { type: "V", values: [y + height - ry] },
                    { type: "A", values: [rx, ry, 0, 0, 1, x + width - rx, y + height] },
                    { type: "H", values: [x + rx] },
                    { type: "A", values: [rx, ry, 0, 0, 1, x, y + height - ry] },
                    { type: "V", values: [y + ry] },
                    { type: "A", values: [rx, ry, 0, 0, 1, x + rx, y] },
                    { type: "Z", values: [] }
                ];
            }
            break;

        case 'circle':
        case 'ellipse':
            cx = this.cx.baseVal.value;
            cy = this.cy.baseVal.value;
            if (type === 'circle') {
                r = this.r.baseVal.value;
            }
            rx = this.rx ? this.rx.baseVal.value : r;
            ry = this.ry ? this.ry.baseVal.value : r;

            pathData = [
                { type: "M", values: [cx + rx, cy] },
                { type: "A", values: [rx, ry, 0, 1, 1, cx - rx, cy] },
                { type: "A", values: [rx, ry, 0, 1, 1, cx + rx, cy] },
            ];

            break;
        case 'line':
            pathData = [
                { type: "M", values: [this.x1.baseVal.value, this.y1.baseVal.value] },
                { type: "L", values: [this.x2.baseVal.value, this.y2.baseVal.value] }
            ];
            break;
        case 'polygon':
        case 'polyline':
            for (let i = 0; i < this.points.numberOfItems; i++) {
                let point = this.points.getItem(i);
                pathData.push({
                    type: (i === 0 ? "M" : "L"),
                    values: [point.x, point.y]
                });
            }
            if (type === 'polygon') {
                pathData.push({
                    type: "Z",
                    values: []
                });
            }
            break;
    }

    /**
     * normalize commands 
     * for processing you usually need 
     * absolute and longhand commands
     */
    let defaults = {
        normalize: false,
        toAbsolute: false,
        arcToCubic: false,
        arcAccuracy: 1,
        quadraticToCubic: false,
        toLonghands: false,
    }

    options = {
        ...defaults,
        ...options
    }

    if (options.normalize === true) {
        options =
        {
            toAbsolute: true,
            arcToCubic: true,
            arcAccuracy: 1,
            quadraticToCubic: true,
            toLonghands: true,
        }
    }

    if (Object.keys(options).length) {
        pathData = convertPathData(pathData, options)
    }

    return pathData;
};

/**
 * retrieve patData from primitives:
 * <circle>, <ellipse>, <rect>, <polygon>, <polyline>, <line>, 
 */
SVGGeometryElement.prototype.convertShapeToPath = function (options = {}) {
    let pathData = this.getPathDataConverted(options);

    // create path element
    let path = document.createElementNS("http://www.w3.org/2000/svg", "path");

    // get all attributes as object
    const setAttributes = (el, attributes, exclude = []) => {
        for (key in attributes) {
            if (exclude.indexOf(key) === -1) {
                el.setAttribute(key, attributes[key]);
            }
        }
    }
    const getAttributes = (el) => {
        let attArr = [...el.attributes];
        let attObj = {};
        attArr.forEach((att) => {
            attObj[att.nodeName] = att.nodeValue;
        });
        return attObj;
    }

    let attributes = getAttributes(this);

    //exclude attributes not needed for paths
    let exclude = ["x", "y", "x1", "y1", "x2", "y2", "cx", "cy", "r", "rx", "ry", "points", "width", "height"];

    // copy attributes to path and set pathData
    setAttributes(path, attributes, exclude);
    decimals = options.decimals ? options.decimals : -1
    minify = options.minify ? options.minify : -1
    path.setPathDataConverted(pathData, decimals, minify);
    this.replaceWith(path);
    return path;
}


SVGPathElement.prototype.setPathDataConverted = function (pathData, decimals = -1, minify = false) {
    this.setAttribute('d', pathDataToD(pathData, decimals, minify))
}