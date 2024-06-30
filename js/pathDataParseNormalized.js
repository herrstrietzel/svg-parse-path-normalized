/**
* Standalone pathData parser
* including normalization options
* returns a pathData array compliant 
* with the w3C SVGPathData interface draft
* https://svgwg.org/specs/paths/#InterfaceSVGPathData
* Usage example:
*     

let options = {
    normalize:false,
    toAbsolute: true,
    toLonghands: true,
    arcToCubic:true,
    quadraticToCubic: true,
    lineToCubic: true,
    debug: false,
    decimals: -1
}
let d = "M 0 0 ... z"
let pathDataAbs = parsePathDataNormalized(d, options)

* revert to d attribute string 
* (options: round to decimals; minify=omit repeated commands)

let d = pathDataToD(pathData, decimals = -1, minify = false)
path.setAttribute('d', d)

* See example codepen: 
* https://codepen.io/herrstrietzel/pen/NWJpOYR
*/
(function (root, factory) {
    if (typeof module !== 'undefined' && module.exports) {
        // CommonJS / Node.js
        module.exports = factory();
    } else if (typeof define === 'function' && define.amd) {
        // AMD 
        define([], factory);
    } else {
        // Browser
        root.parsepathData = factory();
    }
})(this, function () {
    var parsepathData = {};

    function parsePathDataNormalized(d, options = {}) {
        // define options
        let defaults = {
            normalize: null,
            toAbsolute: true,
            toLonghands: true,
            arcToCubic: false,
            quadraticToCubic: false,
            lineToCubic: false,
            debug: false,
            decimals: -1
        }
        options = {
            ...defaults,
            ...options
        }
        let { normalize, toAbsolute, toLonghands, arcToCubic, quadraticToCubic, lineToCubic, debug, decimals } = options;

        /**
         * normalize:true acts as shorthand
         * to normalize to all absolute, arcs or quadratics to cubics, 
         */
        if (normalize === true) {
            toAbsolute = true
            toLonghands = true
            arcToCubic = true
            quadraticToCubic = true
        }

        /**
         * normalize:false acts as shorthand
         * to keep the original pathdata as it is, 
         */
        else if (normalize === false) {
            toAbsolute = false
            toLonghands = false
            arcToCubic = false
            quadraticToCubic = false
            lineToCubic = false
        }

        d = d
            // remove new lines, tabs an comma with whitespace
            .replace(/[\n\r\t|,]/g, " ")
            // pre trim left and right whitespace
            .trim()
            // add space before minus sign
            .replace(/(\d)-/g, '$1 -')
            // decompose multiple adjacent decimal delimiters like 0.5.5.5 => 0.5 0.5 0.5
            .replace(/(\.)(?=(\d+\.\d+)+)(\d+)/g, "$1$3 ")

        let pathData = [];
        let cmdRegEx = /([mlcqazvhst])([^mlcqazvhst]*)/gi;
        let commands = d.match(cmdRegEx);

        // valid command value lengths
        let comLengths = { m: 2, a: 7, c: 6, h: 1, l: 2, q: 4, s: 4, t: 2, v: 1, z: 0 };

        // collect errors in debug mode
        let errors = [];
        let firstCommand = d.substring(0, 1).toLowerCase();
        let hasM = firstCommand == 'm';
        let hasQuadratics = quadraticToCubic ? /[qt]/gi.test(d) : false;
        let hasArcs = arcToCubic ? /[a]/gi.test(d) : false;
        let hasShorthands = toLonghands ? /[vhst]/gi.test(d) : false;
        let hasRelative = toAbsolute ? /[lcqamts]/g.test(d.substring(1, d.length - 1)) : false;

        // dummy pathdata for error reporting
        let dummyPathData = [
            { type: 'M', values: [0, 0], errors: [] },
            { type: 'L', values: [0, 0] }
        ];

        // offsets for absolute conversion
        let offX, offY, lastX, lastY, M;


        // no M starting command – return dummy pathdata
        if (!hasM) {
            dummyPathData[0].errors.push('No starting M command')
            return dummyPathData;
        }

        for (let c = 0; c < commands.length; c++) {
            let com = commands[c];
            let type = com.substring(0, 1);
            let typeRel = type.toLowerCase();
            let typeAbs = type.toUpperCase();
            let isRel = type === typeRel;
            let chunkSize = comLengths[typeRel];

            // split values to array
            let values = com.substring(1, com.length)
                .trim()
                .split(" ").filter(Boolean);

            /**
             * A - Arc commands
             * large arc and sweep flags
             * are boolean and can be concatenated like
             * 11 or 01
             * or be concatenated with the final on path points like
             * 1110 10 => 1 1 10 10
             */
            if (typeRel === "a" && values.length != comLengths.a) {

                let n = 0,
                    arcValues = [];
                for (let i = 0; i < values.length; i++) {
                    let value = values[i];

                    // reset counter
                    if (n >= chunkSize) {
                        n = 0;
                    }
                    // if 3. or 4. parameter longer than 1
                    if ((n === 3 || n === 4) && value.length > 1) {
                        let largeArc = n === 3 ? value.substring(0, 1) : "";
                        let sweep = n === 3 ? value.substring(1, 2) : value.substring(0, 1);
                        let finalX = n === 3 ? value.substring(2) : value.substring(1);
                        let comN = [largeArc, sweep, finalX].filter(Boolean);
                        arcValues.push(comN);
                        n += comN.length;


                    } else {
                        // regular
                        arcValues.push(value);
                        n++;
                    }
                }
                values = arcValues.flat().filter(Boolean);
            }

            if (debug && typeRel === "a" && (values[3] > 1 || values[4] > 1 || values[3] < 0 || values[4] < 0)) {
                errors.push(
                    `${c}. command (${type}) has invalid flag values: ${values[3]} ${values[4]}`
                );
            }

            // string  to number
            values = values.map(Number)

            // if string contains repeated shorthand commands - split them
            let hasMultiple = values.length > chunkSize;
            let chunk = hasMultiple ? values.slice(0, chunkSize) : values;
            let comChunks = [{ type: type, values: chunk }];

            if (debug && comChunks[0].values.length < chunkSize) {
                errors.push(
                    `${c}. command (${type}) has ${chunk.length
                    }/${chunkSize} - ${chunk.length} values too few `
                );
            }

            // has implicit or repeated commands – split into chunks
            if (hasMultiple) {
                let typeImplicit = typeRel === "m" ? (isRel ? "l" : "L") : type;
                for (let i = chunkSize; i < values.length; i += chunkSize) {
                    let chunk = values.slice(i, i + chunkSize);
                    comChunks.push({ type: typeImplicit, values: chunk });
                    if (debug && chunk.length !== chunkSize) {

                        let overhead = Math.ceil(chunkSize/chunk.length);
                        let ideal = overhead * chunkSize
                        let feedback = chunk.length<ideal ? 'too few' : 'too many';
                        let diff = Math.abs(chunk.length + chunkSize - ideal);

                        errors.push(
                            `${i}. command (${type}) has ${chunk.length + chunkSize} values - ${diff} values ${feedback} - should be ${overhead} commands with ${chunkSize} values per command`
                        );
                    }
                }
            }

            // no relative, shorthand or arc command - return current 
            if (normalize === false || (!hasRelative && !hasQuadratics && !hasShorthands && !hasArcs)) {
                comChunks.forEach((com) => {
                    pathData.push(com);
                });
            }

            /**
             * convert to absolute 
             * init offset from 1st M
             */
            else {
                if (c === 0) {
                    offX = values[0];
                    offY = values[1];
                    lastX = offX;
                    lastY = offY;
                    M = { x: values[0], y: values[1] };

                }

                let typeFirst = comChunks[0].type;
                typeAbs = typeFirst.toUpperCase()

                // first M is always absolute
                isRel = typeFirst.toLowerCase() === typeFirst && pathData.length ? true : false;

                for (let i = 0; i < comChunks.length; i++) {
                    let com = comChunks[i];
                    let type = com.type;
                    let values = com.values;
                    let valuesL = values.length;
                    let comPrev = comChunks[i - 1]
                        ? comChunks[i - 1]
                        : c > 0 && pathData[pathData.length - 1]
                            ? pathData[pathData.length - 1]
                            : comChunks[i];

                    let valuesPrev = comPrev.values;
                    let valuesPrevL = valuesPrev.length;
                    isRel = comChunks.length > 1 ? type.toLowerCase() === type && pathData.length : isRel;

                    if (isRel) {
                        com.type = comChunks.length > 1 ? type.toUpperCase() : typeAbs;

                        switch (typeRel) {
                            case "a":
                                com.values = [
                                    values[0],
                                    values[1],
                                    values[2],
                                    values[3],
                                    values[4],
                                    values[5] + offX,
                                    values[6] + offY
                                ];
                                break;

                            case "h":
                            case "v":
                                com.values = type === "h" ? [values[0] + offX] : [values[0] + offY];
                                break;

                            case "m":
                            case "l":
                            case "t":
                                //update last M
                                if (type === 'm') {
                                    M = { x: values[0] + offX, y: values[1] + offY };
                                }
                                com.values = [values[0] + offX, values[1] + offY];
                                break;

                            case "c":
                                com.values = [
                                    values[0] + offX,
                                    values[1] + offY,
                                    values[2] + offX,
                                    values[3] + offY,
                                    values[4] + offX,
                                    values[5] + offY
                                ];
                                break;

                            case "q":
                            case "s":
                                com.values = [
                                    values[0] + offX,
                                    values[1] + offY,
                                    values[2] + offX,
                                    values[3] + offY
                                ];
                                break;

                            case 'z':
                            case 'Z':
                                lastX = M.x;
                                lastY = M.y;
                                break;

                        }
                    }
                    // is absolute
                    else {
                        offX = 0;
                        offY = 0;
                    }

                    /**
                     * convert shorthands
                     */
                    let shorthandTypes = ["H", "V", "S", "T"];

                    if ((toLonghands && shorthandTypes.includes(typeAbs)) || (arcToCubic && shorthandTypes.includes(typeAbs)) || quadraticToCubic) {
                        let cp1X, cp1Y, cpN1X, cpN1Y, cp2X, cp2Y;
                        if (com.type === "H" || com.type === "V") {
                            com.values =
                                com.type === "H" ? [com.values[0], lastY] : [lastX, com.values[0]];
                            com.type = "L";
                        } else if (com.type === "T" || com.type === "S") {
                            [cp1X, cp1Y] = [valuesPrev[0], valuesPrev[1]];
                            [cp2X, cp2Y] =
                                valuesPrevL > 2
                                    ? [valuesPrev[2], valuesPrev[3]]
                                    : [valuesPrev[0], valuesPrev[1]];

                            // new control point
                            cpN1X = com.type === "T" ? lastX * 2 - cp1X : lastX * 2 - cp2X;
                            cpN1Y = com.type === "T" ? lastY * 2 - cp1Y : lastY * 2 - cp2Y;

                            com.values = [cpN1X, cpN1Y, com.values].flat();
                            com.type = com.type === "T" ? "Q" : "C";

                        }
                    }

                    /**
                     * linetos to cubic
                     * facilitates morphing animations
                     */
                    if (lineToCubic && com.type === 'L') {
                        com = { type: 'C', values: [lastX, lastY, com.values[0], com.values[1], com.values[0], com.values[1]] }
                    }

                    /**
                     * convert arcs 
                     */
                    if ((arcToCubic && com.type === 'A')) {
                        p0 = { x: lastX, y: lastY }
                        if (typeRel === 'a') {
                            let comArc = arcToBezier(p0, com.values)
                            comArc.forEach(seg => {
                                pathData.push(seg);
                            })
                        }
                    }

                    else {
                        // add to pathData array
                        pathData.push(com);
                    }

                    // update offsets
                    lastX =
                        valuesL > 1
                            ? values[valuesL - 2] + offX
                            : typeRel === "h"
                                ? values[0] + offX
                                : lastX;
                    lastY =
                        valuesL > 1
                            ? values[valuesL - 1] + offY
                            : typeRel === "v"
                                ? values[0] + offY
                                : lastY;
                    offX = lastX;
                    offY = lastY;
                }
            }
        }

        /**
         * path data has errors:
         * return dummyPathData 
         * including an error report
         */
        if (debug && errors.length) {
            dummyPathData[0].errors.push(errors)
            return dummyPathData
        }

        /**
         * first M is always absolute/uppercase -
         * unless it adds relative linetos
         * (facilitates d concatenating)
         */
        pathData[0].type = "M";

        /**
        * convert quadratics to cubic
        */

        if (hasQuadratics && quadraticToCubic) {
            for (let i = 0; i < pathData.length; i++) {
                let com = pathData[i];
                if (com.type === 'Q' && hasQuadratics && quadraticToCubic) {
                    let comPrev = pathData[i - 1];
                    let comPrevValues = comPrev.values;
                    let comPrevValuesL = comPrevValues.length;
                    let p0 = { x: comPrevValues[comPrevValuesL - 2], y: comPrevValues[comPrevValuesL - 1] }
                    pathData[i] = quadratic2Cubic(p0, com.values)
                }
            }
        }

        // round coordinates
        if (decimals > -1) {
            pathData = pathData.map(com => { return { type: com.type, values: com.values.map(val => { return +val.toFixed(decimals) }) } });
        }

        return pathData;
    }


    /**
    * convert quadratic commands to cubic
    */
    function quadratic2Cubic(p0, values) {

        let cp1 = {
            x: p0.x + 2 / 3 * (values[0] - p0.x),
            y: p0.y + 2 / 3 * (values[1] - p0.y)
        }
        let cp2 = {
            x: values[2] + 2 / 3 * (values[0] - values[2]),
            y: values[3] + 2 / 3 * (values[1] - values[3])
        }

        return ({ type: "C", values: [cp1.x, cp1.y, cp2.x, cp2.y, values[2], values[3]] });
    }


    /** 
    * convert arctocommands to cubic bezier
    * based on puzrin's a2c.js
    * https://github.com/fontello/svgpath/blob/master/lib/a2c.js
    * returns pathData array
    */

    function arcToBezier(p0, values, splitSegments = 1) {
        const TAU = Math.PI * 2;
        let [rx, ry, rotation, largeArcFlag, sweepFlag, x, y] = values;

        if (rx === 0 || ry === 0) {
            return []
        }

        let phi = rotation ? rotation * TAU / 360 : 0;
        let sinphi = phi ? Math.sin(phi) : 0
        let cosphi = phi ? Math.cos(phi) : 1
        let pxp = cosphi * (p0.x - x) / 2 + sinphi * (p0.y - y) / 2
        let pyp = -sinphi * (p0.x - x) / 2 + cosphi * (p0.y - y) / 2

        if (pxp === 0 && pyp === 0) {
            return []
        }
        rx = Math.abs(rx)
        ry = Math.abs(ry)
        let lambda =
            pxp * pxp / (rx * rx) +
            pyp * pyp / (ry * ry)
        if (lambda > 1) {
            let lambdaRt = Math.sqrt(lambda);
            rx *= lambdaRt
            ry *= lambdaRt
        }

        /** 
        * parametrize arc to 
        * get center point start and end angles
        */
        let rxsq = rx * rx,
            rysq = rx === ry ? rxsq : ry * ry

        let pxpsq = pxp * pxp,
            pypsq = pyp * pyp
        let radicant = (rxsq * rysq) - (rxsq * pypsq) - (rysq * pxpsq)

        if (radicant <= 0) {
            radicant = 0
        } else {
            radicant /= (rxsq * pypsq) + (rysq * pxpsq)
            radicant = Math.sqrt(radicant) * (largeArcFlag === sweepFlag ? -1 : 1)
        }

        let centerxp = radicant ? radicant * rx / ry * pyp : 0
        let centeryp = radicant ? radicant * -ry / rx * pxp : 0
        let centerx = cosphi * centerxp - sinphi * centeryp + (p0.x + x) / 2
        let centery = sinphi * centerxp + cosphi * centeryp + (p0.y + y) / 2

        let vx1 = (pxp - centerxp) / rx
        let vy1 = (pyp - centeryp) / ry
        let vx2 = (-pxp - centerxp) / rx
        let vy2 = (-pyp - centeryp) / ry

        // get start and end angle
        const vectorAngle = (ux, uy, vx, vy) => {
            let dot = +(ux * vx + uy * vy).toFixed(9)
            if (dot === 1 || dot === -1) {
                return dot === 1 ? 0 : Math.PI
            }
            dot = dot > 1 ? 1 : (dot < -1 ? -1 : dot)
            let sign = (ux * vy - uy * vx < 0) ? -1 : 1
            return sign * Math.acos(dot);
        }

        let ang1 = vectorAngle(1, 0, vx1, vy1),
            ang2 = vectorAngle(vx1, vy1, vx2, vy2)

        if (sweepFlag === 0 && ang2 > 0) {
            ang2 -= Math.PI * 2
        }
        else if (sweepFlag === 1 && ang2 < 0) {
            ang2 += Math.PI * 2
        }

        let ratio = +(Math.abs(ang2) / (TAU / 4)).toFixed(0)

        // increase segments for more accurate length calculations
        let segments = ratio * splitSegments;
        ang2 /= segments
        let pathDataArc = [];


        /**
        * If 90 degree circular arc, use a constant
        * https://pomax.github.io/bezierinfo/#circles_cubic
        * k=0.551784777779014
        */ 

        const angle90 = 1.5707963267948966;
        const k = 0.551785
        let a = ang2 === angle90 ? k :
            (
                ang2 === -angle90 ? -k : 4 / 3 * Math.tan(ang2 / 4)
            );

        let cos2 = ang2 ? Math.cos(ang2) : 1;
        let sin2 = ang2 ? Math.sin(ang2) : 0;
        let type = 'C'

        const approxUnitArc = (ang1, ang2, a, cos2, sin2) => {
            let x1 = ang1 != ang2 ? Math.cos(ang1) : cos2;
            let y1 = ang1 != ang2 ? Math.sin(ang1) : sin2;
            let x2 = Math.cos(ang1 + ang2);
            let y2 = Math.sin(ang1 + ang2);

            return [
                { x: x1 - y1 * a, y: y1 + x1 * a },
                { x: x2 + y2 * a, y: y2 - x2 * a },
                { x: x2, y: y2 }
            ];
        }

        for (let i = 0; i < segments; i++) {
            let com = { type: type, values: [] }
            let curve = approxUnitArc(ang1, ang2, a, cos2, sin2);

            curve.forEach((pt) => {
                let x = pt.x * rx
                let y = pt.y * ry
                com.values.push(cosphi * x - sinphi * y + centerx, sinphi * x + cosphi * y + centery)
            })
            pathDataArc.push(com);
            ang1 += ang2
        }

        return pathDataArc;
    }


    // wrapper for stringified path data output
    Array.prototype.toD = function (decimals = -1, minify = false) {
        return pathDataToD(this, decimals, minify);
    }

    /**
     * serialize pathData array to 
     * d attribute string 
     */
    function pathDataToD(pathData, decimals = -1, minify = false) {

        // implicit l command
        if (pathData[1].type === "l" && minify) {
            pathData[0].type = "m";
        }
        let d = `${pathData[0].type}${pathData[0].values.join(" ")}`;

        for (let i = 1; i < pathData.length; i++) {
            let com0 = pathData[i - 1];
            let com = pathData[i];
            let { type, values } = com;

            // minify arctos
            if (minify && type === 'A' || type === 'a') {
                values = [values[0], values[1], values[2], [values[3], values[4], values[5]].join(''), values[6]]
            }

            // round
            if (values.length && decimals > -1) {
                values = values.map(val => { return typeof val === 'number' ? +val.toFixed(decimals) : val })
            }

            // omit type for repeated commands
            type = (com0.type === com.type && com.type.toLowerCase() != 'm' && minify) ?
                " " : (
                    (com0.type === "m" && com.type === "l") ||
                    (com0.type === "M" && com.type === "l") ||
                    (com0.type === "M" && com.type === "L")
                ) && minify ?
                    " " : com.type;

            d += `${type}${values.join(" ")}`;
        }

        if (minify) {
            d = d
                .replaceAll(" 0.", " .")
                .replaceAll(" -", "-")
                .replaceAll("-0.", "-.")
                .replaceAll("Z", "z");
        }
        return d;
    }

    parsepathData.parsePathDataNormalized = parsePathDataNormalized;
    parsepathData.pathDataToD = pathDataToD;
    parsepathData.arcToBezier = arcToBezier;


    return parsepathData;
});



if (typeof module === 'undefined') {
    var { parsePathDataNormalized, pathDataToD, arcToBezier } = parsepathData;
}

