[![npm version](https://img.shields.io/npm/v/svg-parse-path-normalized.svg)](https://www.npmjs.com/package/svg-parse-path-normalized)


# svg-parse-path-normalized
Parses path data from string including *fine-grained* normalisation and conversion options.  

This library aims to provide a robust and versatile yet *quite* compact (~6KB/3KB minified; gzipped) parser – respecting all minified/shorthand notations as a basis for all kinds of custom path data manipulations. Compatible with the [w3C SVGPathData interface draft](https://svgwg.org/specs/paths/#InterfaceSVGPathData) format recommendations.  

## Yet another SVG path parser?
While there is no shortage of excellent parsers – unfortunately, the same applies to rather **incomplete ones** often deployed in libraries due to their appealing lightweight codebase.  

1. **Minified `A` arcto commands** quite often lightweight parsers crash since they can't unravel concatenated `largeArc`, `sweep` and final on path x values.  
2. You may not need to load a full fledged SVG library but just a robust **foundation for your specific SVG path manipulations**.  
3. **Finegrained normalization:** Normalize as little as possible: Usually, you need at least absolute coordinates as well as "unshortened" ones. You may in some case need to convert quadratic béziers to cubics or `A` arcs to cubics – your choice – by default the parser will return the least destructive normalization.
4. **Just parsing without normalization?** Fair enough, works as well e.g if you need a to scale the path data proportinally/keeping the aspect ratio.
5. **Debugging** Sometimes you may also need some hints to what's wrong with your current path data – e.g if paths were sliced or concatenated incorrectly. The debugging option will return info about the problematic commands.



## Table of content

* [1. Basic functionality and helpers](#1-basic-functionality-and-helpers)
  + [1.1 Parse, normalize and stringify](#11-parse-normalize-and-stringify)
  + [1.2 Advanced conversions](#12-advanced-conversions)
* [2. Usage parser](#2-usage-parser)
  + [2.1 Browser](#21-browser)
  + [2.2 Node](#22-node)
* [3. Pathdata format](#3-pathdata-format)
* [4. All normalization options](#4-all-normalization-options)
  + [4.1 Original path data: normalization disabled](#41-original-path-data-normalization-disabled)
  + [4.2 Recommendations](#42-recommendations)
* [5. Stringify to back to d attribute string](#5-stringify-to-back-to-d-attribute-string)
* [6. More conversions via pathDataConvert.js](#6-more-conversions-via-pathdataconvertjs)
  + [6.1 Usage](#61-usage)
  + [6.2 Usage as an addon/plugin for getPathData()](#62-usage-as-an-addon-plugin-for-getpathdata)
  + [6.3 Convert pathdata structure](#63-convert-pathdata-structure)
    - [6.3.1 Array notation to pathdata](#631-array-notation-to-pathdata)
    - [6.3.2 pathDataToVerbose(pathData)](#632-pathdatatoverbosepathdata)
* [7. Changelog](#7-changelog)
* [8. Demos](#8-demos)
* [9. Limitations](#9-limitations)
* [Credits](#credits)




## 1. Basic functionality and helpers

### 1.1 Parse, normalize and stringify 
Usually parsing alone is not enough to get computable path data values – due to relative or shorthand commands or `a` arcto commands that may rather complicate further manipulations such as length or area calculations – especially when dealing with elliptical and/or rotated arcs.  

Normalization (admittedly a slightly ambigious term) via `parsePathDataNormalized(d)` applies by default these conversions:  
* (default) all commands to **absolute**
* (default) decompose **implicit or repeated** commands  
   e.g `m 0 0 .5.5.5.5` to `M 0 0 l 0.5 0.5 l 0.5 0.5`
* commands to **shorthand/reflected** commands to longhand equivalents like e.g `h`, `v`, `s`, `t` to `L`, `C`, `T`
* *(optional)* convert/approximate **arcs to cubics**
* *(optional)* convert **quadratic béziers to cubics**
* *(optional)* **debug:** detect malformed path data inputs
* *(optional)* **round** coordinates 
* **stringify to `d` attribute** – including minification options

### 1.2 Advanced conversions  
Provided by `pathDataConvert.js`: Useful to convert your manipulated/processed path data to all kind of command types/structures
(E.g to get a more compact or special formats like lineto-to-bezier conversions for morphing animations by converting)
* all commands to **relative** (usually more concise in file size)
* **apply shorthands** – if possible (also decreases filesize)
* **linetos to cubic** or quadratic béziers
* **cubic béziers to quadratic**  
* **different path data formats** e.g array based path data notations as used in snap.svg and other libraries or APIs
* this scripts also includes all normalizations options such as **relative-absolute**, **shorthand-to-longhands**, **rounding** etc.
* can be used as an **addon complementing `getPathData()`** or other parsers compliant with the [w3C SVGPathData interface draft](https://svgwg.org/specs/paths/#InterfaceSVGPathData) format recommendations.


## 2. Usage parser

**Update:** You can now use a more convenient function name for the parsing - the more verbose/clunky function still works. Since this parser aims to parse path data into a processable data array, "parsePathDataNormalized" is semantically more accurate – I hope you understand my naming delemma =) 

```
/* shorthand notation */
let pathData = parseD(d, options)
```

```
/* original notation */
let pathData = parsePathDataNormalized(d, options)
```
Feel free to post an issue or write a post in the discussion if the recent update messed up anything.


### 2.1 Browser

``` lang-html
<script src="https://www.unpkg.com/svg-parse-path-normalized@latest/js/pathDataParseNormalized.js"></script>
```

**Optional: Load minified script via jsDelivr  (~6KB/3KB minified; gzipped)**
```
<!--basic parser --->
<script src="https://cdn.jsdelivr.net/npm/svg-parse-path-normalized@latest/js/pathDataParseNormalized.min.js"></script>
```

```
<script>

//parse
const d ="m 0 0 .5.5.5.5a 5 10 45 1040 20" ;

/* shorthand notation */
let pathData = parseD(d)

/* verbose notation */
let pathData = parsePathDataNormalized(d)


//stringify to pathdata d string
let minify = false;

/* chainable notation */
let dNew = pathData.toD(decimals, minify);

/* classic function syntax */
let dNew = pathDataToD(pathData, decimals, minify);

console.log(pathData);
console.log(dNew);

</script>
```

### 2.2 Node

```
npm install svg-parse-path-normalized
```

``` lang-js

const parsepathData = require('svg-parse-path-normalized');
const {parsePathDataNormalized, pathDataToD} = parsepathData;

//parse
const d ="m 0 0 .5.5.5.5a 5 10 45 1040 20" ;
let pathData = parsePathDataNormalized(d)

//stringify to pathdata d string
let minify = false;
let dNew = pathDataToD(pathData, 1, minify);

console.log(pathData);
console.log(dNew);

```

## 3. Pathdata format

This library uses the pathdata format as suggested in the [w3C SVGPathData interface draft](https://svgwg.org/specs/paths/#InterfaceSVGPathData).

The returned path data parsed from a stringified pathdata `d` attribute string is an array representing each command as an object like so:  

``` lang-js
const d ="m 0 0 .5.5.5.5a 5 1045 1040 20" 
parsePathDataNormalized(d)
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
We need an extra check to "unravel" the `A` arcto's `largeArc` and `sweep` flags, which can be concatenated with the subsequent on-path x coordinate value. (See [basic example](https://codepen.io/herrstrietzel/pen/NWJpOYR))


## 4. All normalization options

`parsePathDataNormalized(d, options)` accepts these parameters

```
let options= {
    normalize: null,          //shorthand for aggressive normalisation
    toAbsolute: true,         //necessary for most calculations
    unshort: true,            //dito
    arcToCubic: false,        //sometimes necessary
    quadraticToCubic: false,  //frankly, not necessary most of the time
    lineToCubic: false,       //handy for morphing animations
    debug: false,             //handy to detect malformed pathdata retrieved from user inputs
    decimals: -1              //-1=no rounding
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

### 4.1 Original path data: normalization disabled
Set normalize to false to get the original (not normalized) pathdata – including relative or shorthand commands.     

 `parsePathDataNormalized(d, {normalize:false})`  

### 4.2 Recommendations
* Quadratic béziers usually provide much faster calculations/algorithms – think twice before converting to cubic.
* `debug:true` can be handy if you need to find errors in malformed pathdata – maybe caused by manual path splitting
* Arc to cubic conversion/approximation is quite complex and thus quite expensive – you may not need this conversion


## 5. Stringify to back to `d` attribute string  

**Options:**   
* decimals: rounds pathdata
* minify: omits command letters for implicit or repeated commands and leading zeros

You can stringify the path data to a `d` attribute (or CSS property) by a chained prototype method or the basic function like so:

```
let d = pathData.toD(decimals, minify)
```

which is just a wrapper for the actual stringifying function.

```
let d = pathDataToD(pathData, decimals, minify) 
```

and eventually apply it like so:

```
path.setAttribute('d', d);
```


----

## 6. More conversions via pathDataConvert.js
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
| cubicToQuadratic | *false* | convert all cubic to quadratic |
| cubicToQuadraticPrecision | 0.1 | cubic to quadratic accuracy |
| decimals | *-1* | round values to floating point decimals. -1=no rounding |
| normalize | *null* , true, false | shorthand to also convert arcs and quadratic béziers to cubic – similar to the W3C draft's suggested `getPathData({normalize:true})` parameter |  
| optimize | *false* | shorthand to convert to shorthands, relative and round to 3 decimals for a more compact output |  

### 6.1 Usage

```
<script src="https://www.unpkg.com/svg-parse-path-normalized@latest/js/pathDataConvert.js"></script>
```

Load minified via jsDelivr  (13KB/6KB minified)
```
<!-- optional conversions -->
<script src="https://cdn.jsdelivr.net/npm/svg-parse-path-normalized@latest/js/pathDataConvert.min.js"></script>
```

```
let options = {arcToCubic:true, toRelative:true, decimals:0}
let pathDataCon = pathData.convert(options)
```

**Conversion can be applied via**
* chainable prototype method `convert(options)` to apply all conversions at once
* separate chainable methods like `pathData.toAbsolute()`, `pathData.toRelative()`, `pathData.toLonghands()`,  `pathData.toShorthands()`, `pathData.round()`, `pathData.toQuadratic()`, `pathData.toVerbose()`
* individual functions like `pathDataToAbsolute(pathData)`, `pathDataToRelative(pathData)`, `pathDataToShorthands(pathData)`, `pathDataToShorthands(pathData)`, `pathDataToQuadratic(pathData)`, `roundPathData(pathData)`

### 6.2 Usage as an addon/plugin for `getPathData()`
Currently, the  W3C draft for the SVGPathData interface is not supported by any major browser. Fortunately Jarek Foksa wrote a this [great polyfill library](https://github.com/jarek-foksa/path-data-polyfill) and also contributed to the potential spec outcome – most importantly that it should include geometry elements like `circle`, `rect`, `polygon`, `line` to retrieve path data.  
**This polyfill is a "battle-proof" parser!** Since the W3C draft doesn't  include fine-grained control over the normalisation/conversion process you can use the `pathDataConvert.js` script as an addon/plugin  alongside with the aforementioned polyfill script. (See Demo/getPathDataAddon.html)

### 6.3 Convert pathdata structure
You may already have a set of parsed/abstracted path data retrieved from other libraries or APIs or need a more verbose notation.    
In this case you may use these conversion methods.

#### 6.3.1 Array notation to pathdata
A lot of libraries – such as snap.svg use a nested array structure for each command like so

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

#### 6.3.2 pathDataToVerbose(pathData)
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

## 7. Changelog
* 1.1.0 fixes a rare parsing issue where 'M' commands were omitted (e.g `z` followed by another drawing command than `M` – unfortunately valid). See updated demo with "path-from-hell3".

### Downgrading
In case you encounter any problems with the latest versions you can just load a previous one.  
See npm repo for all [existing versions](https://www.npmjs.com/package/svg-parse-path-normalized?activeTab=versions)
 


## 8. Demos 
* [parse pathdata with different normalization options](https://codepen.io/herrstrietzel/pen/NWJpOYR) (demos/index.html)  
* `pathDataConvert.js` as a [addon/plugin for `path.getPathData()`](https://codepen.io/herrstrietzel/pen/dyreNep) (demos/getPathDataAddon.html)
* [convert commands to pretty much anything](https://codepen.io/herrstrietzel/pen/JjzvRjb) | (demos/converter.html)


## 9. Limitations
This library does only support SVG path data that's actually supported by browsers.  
In other words: these "newer" commands are not included:
* [Catmull-Rom curve commands](https://www.w3.org/TR/2015/WD-SVG2-20150409/paths.html#PathDataCatmullRomCommand)  
* [Bearing commands](https://www.w3.org/TR/2015/WD-SVG2-20150409/paths.html#PathDataBearingCommands)

... and this contextual closepath thing ...  

Seriously, there's no point in implementing these features until they're implemented (see the sad story of SVG multi-line text... we'll probably never get it).   

Especially the Catmull-ROM syntax extension is spooking around for more than 10 years without any results.
Frankly, these features may never be included as they would bomb quite a few renderers and there are visualisation libraries to draw paths in a abstracted way. 



## Credits

* Jarek Foksa for his [great polyfill](https://github.com/jarek-foksa/path-data-polyfill) heavily inspring to adopt the new pathData interface methodology and for contributing to the specification
* Dmitry Baranovskiy for (raphael.j/snap.svg) [pathToAbsolute/Relative functions](https://github.com/DmitryBaranovskiy/raphael/blob/master/raphael.js#L1848) 
* Vitaly Puzrin (fontello) for the arc to cubic conversion method  [a2c.js](https://github.com/fontello/svgpath/blob/master/lib/a2c.js) and [cubic to quadratic approximation](https://github.com/fontello/cubic2quad/blob/master/test/cubic2quad.js)
* Mike "POMAX" Kammermans for his great [A Primer on Bézier Curves](https://pomax.github.io/bezierinfo)

## Related Repositories/projects
All of these helpers are based on the path parser described above (or by-products - although they include stripped down versions for the sake of providing a standalone lib).

* [svg-getpointatlength](https://github.com/herrstrietzel/svg-getpointatlength) – Calculates a path's length or points at length based on raw pathdata
* [fix-path-directions](https://github.com/herrstrietzel/fix-path-directions) – Correct sub path directions in compound path for apps that don't support fill-rules or just reverse path directions (e.g for path animations)
* [svg-pathdata-getbbox](https://github.com/herrstrietzel/svg-pathdata-getbbox) – Calculates a path bounding box based on its raw pathdata
* [svg-transform](https://github.com/herrstrietzel/svg-transform) – A library to transform or de-transform/flatten svg paths








