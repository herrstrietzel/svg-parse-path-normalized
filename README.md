# svg-parse-path-normalized
Parse path data from string including *fine-grained* normalisation options.  
This library aims to provide a performant yet compact parser – respecting all possible minified/shorthand notations as a basis for all kinds of custom path manipulations.

In other words: **this library focuses on the parsing and conversion** (input and final output) part:  
* **step1 – parse** – parse the path to a calculable data set
* **step2 – your turn!** – process the path data whatever you like
* **step3 – write back**  – a stringified `d` attribute (maybe optimized/minified)


## Usage 
**Browser**

``` lang-html
<script src="https://www.unpkg.com/svg-parse-path-normalized@latest/js/pathDataParseNormalized.js"></script>
```

**Optional: Load minified script via jsDelivr  (6KB/3KB minified)**
```
<!--basic parser --->
<script src="https://cdn.jsdelivr.net/npm/svg-parse-path-normalized@1.0.2/js/pathDataParseNormalized.min.js"></script>
```

```
<script>
const {parsepathDataNormalized, pathDataToD} = parsepathData;

//parse
const d ="m 0 0 .5.5.5.5a 5 10 45 1040 20" ;
let pathData = parsepathDataNormalized(d)

//stringify to pathdata d string
let minify = false;
let dNew = pathDataToD(pathData, 1, minify);

console.log(pathData);
console.log(dNew);

</script>
```

**Node**

```
npm install svg-parse-path-normalized
```

``` lang-js

const parsepathData = require('svg-parse-path-normalized');
const {parsepathDataNormalized, pathDataToD} = parsepathData;

//parse
const d ="m 0 0 .5.5.5.5a 5 10 45 1040 20" ;
let pathData = parsepathDataNormalized(d)

//stringify to pathdata d string
let minify = false;
let dNew = pathDataToD(pathData, 1, minify);

console.log(pathData);
console.log(dNew);

```

## Pathdata format/structure

This library uses the pathdata format as suggested in the [w3C SVGPathData interface draft](https://svgwg.org/specs/paths/#InterfaceSVGPathData).

The returned path data parsed from a stringified pathdata `d` attribute string is an array representing each command as an object like so:  

``` lang-js
const d ="m 0 0 .5.5.5.5a 5 1045 1040 20" 
parsepathDataNormalized(d)
```

``` lang-js
[
    {"type":"M","values":[0,0]},
    {"type":"L","values":[0.5, 0.5]},
    {"type":"L","values":[1, 1]},
    {"type":"A","values":[5, 10, 45, 1, 0, 41, 21]}
]
```

The above example illustrates a problem with overly "lightweight" path parsers:  
We need an extra check to "unravel" the `A` arcto's `largeArc` and `sweep` flags, which are concatenated with the subsequent on-path x coordinate value.

See [codepen demo](https://codepen.io/herrstrietzel/pen/NWJpOYR)   

## Normalization or basic conversions to computable data
Normalization (admittedly a slightly ambigious term) via `parsepathDataNormalized(d)` applies by default these conversions:  
* **imlicit or repeated** commands to explicit  
   e.g `m 0 0 .5.5.5.5` to `M 0 0 l 0.5 0.5 l 0.5 0.5`
* all commands are converted to **absolute** coordinates
* **shorthand/reflected** commands are converted to their langhand equivalents   
   e.g `h`, `v`, `s`, `t` to `L`, `C`, `T`


### Additional normalization options

`parsepathDataNormalized(d, options)` accepts these parameters

```
let options= {
    normalize: null,
    toAbsolute: true,
    unshort: true,
    arcToCubic: false,
    quadraticToCubic: false,
    lineToCubic: false,
    debug: false,
    decimals: -1
}
```

| parameter | default | effect |
| -- | -- | -- |
| toAbsolute | true | convert all to absolute |
| unshort | true | convert all shorthands to longhands |
| arcToCubic | *false* | convert arcs `A` commands to cubic béziers |
| quadraticToCubic | *false* | convert quadratic to cubic béziers |
| lineToCubic | *false* | convert all `L` linetos to cubic béziers (handy for morphing animations) |
| decimals | *-1* | round values to floating point decimals. -1=no rounding |
| debug | *false* | reports malformed path data structures via `console.log`|
| normalize | *null* | shorthand to also convert arcs and quadratic béziers to cubic – similar to the W3C draft's suggested `getPathData({normalize:true})` parameter |  

### Original path data – normalization disabled
Set normalize to false to get the original (not normalized) pathdata – including relative or shorthand commands.     

 `parsepathDataNormalized(d, {normalize:false})`  


## Stringify to back to `d` attribute string  

**Options:**   
* decimals: rounds pathdata
* minify: omits command letters for implicit or repeated commands and leading zeros

```
pathDataToD(pathData, decimals, minify) 
```


### Recommendations
* Quadratic béziers usually provide much faster calculations/algorithms – think twice before converting to cubic.
* `debug:true` can be handy if you need to find errors in malformed pathdata – maybe caused by manual path splitting
* Arc to cubic conversion/approximation is quite complex and thus quite expensive – you may not need this conversion

----

## More conversions via pathDataConvert.js
Load `pathDataConvert.js` to get more conversion methods. This script is intended to provide various conversions to optimize the path data after processing e.g for a minified path output.  

| parameter | default | effect |
| -- | -- | -- |
| toRelative | *false* | convert all to relative |
| toAbsolute | true | convert all to absolute |
| toShorthands | *false* | convert all to to shorthands – if applicable |
| toLonghands | true | convert all shorthands to longhands |
| arcToCubic | *false* | convert arcs `A` commands to cubic béziers |
| lineToCubic | *false* | convert all `L` linetos to cubic béziers (handy for morphing animations) |
| quadraticToCubic | *false* | convert quadratic to cubic béziers |
| cubicToQuadratic | true | convert all cubic to quadratic |
| cubicToQuadraticPrecision | 0.1 | cubic to quadratic accuracy |
| decimals | *-1* | round values to floating point decimals. -1=no rounding |
| normalize | *null* , true, false | shorthand to also convert arcs and quadratic béziers to cubic – similar to the W3C draft's suggested `getPathData({normalize:true})` parameter |  
| optimize | *false* | shorthand to convert to shorthands, relative and round to 3 decimals for a more compact output |  

### Usage

```
<script src="https://www.unpkg.com/svg-parse-path-normalized@latest/js/pathDataConvert.js"></script>
```

Load minified via jsDelivr  (13KB/6KB minified)
```
<!-- optional conversions -->
<script src="https://cdn.jsdelivr.net/npm/svg-parse-path-normalized@1.0.2/js/pathDataConvert.min.js"></script>
```

```
//init
const {convertPathData, quadratic2Cubic, roundPathData, pathDataToRelative, pathDataToAbsolute, pathDataToLonghands, pathDataToShorthands, pathDataToQuadratic, cubicToQuad, arcToBezier, pathDataToVerbose, convertArrayPathData, revertPathDataToArray, svgArcToCenterParam} = pathDataConvert;

let options = {arcToCubic:true, toRelative:true, decimals:0}
let pathDataCon = pathData.convert(options)
```

**Conversion can be applied via**
* chainable prototype method `convert(options)` to apply all conversions at once
* separate chainable methods like `pathData.toAbsolute()`, `pathData.toRelative()`, `pathData.toLonghands()`,  `pathData.toShorthands()`, `pathData.round()`, `pathData.toQuadratic()`, `pathData.toVerbose()`
* individual functions like `pathDataToAbsolute(pathData)`, `pathDataToRelative(pathData)`, `pathDataToShorthands(pathData)`, `pathDataToShorthands(pathData)`, `pathDataToQuadratic(pathData)`, `roundPathData(pathData)`

### `pathDataConvert.js` as an addon/plugin for `getPathData()`
Currently, the  W3C draft for the SVGPathData interface is not supported by any major browser. Fortunately Jarek Foksa wrote a this [great polyfill library](https://github.com/jarek-foksa/path-data-polyfill) and also contributed to the potential spec outcome – most importantly that it should include geometry elements like `circle`, `rect`, `polygon`, `line` to retrieve path data.  
**This polyfill is a "battle-proof" parser!** Since the W3C draft doesn't  include fine-grained control over the normalisation/conversion process you can use the `pathDataConvert.js` script as an addon/plugin  alongside with the aforementioned polyfill script.

### Convert pathdata structure
A lot of libraries use a array structure for each command like so

```
[
    ["M", 0, 0] ,
    ["L", 0.5, 0.5],
    ["L", 1, 1],
    ["A", 5, 10, 45, 1, 0, 41, 21]
]
```
In case you need to convert these you can use the helper methods (included in pathDataConvert.js) to convert format in both directions
* `convertArrayPathData(pathDataArray)` 
* `revertPathDataToArray(pathData)`

**pathDataToVerbose(pathData)**  
Besides you can use `pathDataToVerbose(pathData)` to get a more detailed data array including original and absolute point coordinates as well as parametrized arc data `rx` and `ry`,  `startAngle`, `endAngle`, `deltaAngle` (in radians)

```
let data = [
  {
    type: "M",
    values: [0, 0],
    valuesAbsolute: [0, 0],
    pFinal: { x: 0, y: 0 },
    isRelative: false
  },
  {
    type: "l",
    values: [0.5, 0.5],
    valuesAbsolute: [0.5, 0.5],
    pFinal: { x: 0.5, y: 0.5 },
    isRelative: true,
    pPrev: { x: 0, y: 0 }
  },
  {
    type: "l",
    values: [0.5, 0.5],
    valuesAbsolute: [1, 1],
    pFinal: { x: 1, y: 1 },
    isRelative: true,
    pPrev: { x: 0.5, y: 0.5 }
  },
  {
    type: "a",
    values: [5, 10, 45, 1, 0, 40, 20],
    valuesAbsolute: [5, 10, 45, 1, 0, 41, 21],
    pFinal: { x: 41, y: 21 },
    isRelative: true,
    pPrev: { x: 1, y: 1 },
    rx: 21.505813167606572,
    ry: 43.011626335213144,
    xAxisRotation: 45,
    largeArcFlag: 1,
    sweepFlag: 0,
    startAngle: 2.976443999504017,
    endAngle: 6.118036608390327,
    deltaAngle: -3.1415926982932767
  }
];
```



## Credits

* Jarek Foksa for his [great polyfill](https://github.com/jarek-foksa/path-data-polyfill) heavily inspring to adopt the new pathData interface methodology and for contributing to the specification
* Dmitry Baranovskiy for (raphael.j/snap.svg) [pathToAbsolute/Relative functions](https://github.com/DmitryBaranovskiy/raphael/blob/master/raphael.js#L1848) 
* Vitaly Puzrin (fontello) for the arc to cubic conversion method  [a2c.js](https://github.com/fontello/svgpath/blob/master/lib/a2c.js) and [cubic to quadratic approximation](https://github.com/fontello/cubic2quad/blob/master/test/cubic2quad.js)
* Mike "POMAX" Kammermans for his great [A Primer on Bézier Curves](https://pomax.github.io/bezierinfo)



