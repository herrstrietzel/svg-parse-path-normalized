# svg-parse-path-normalized
Parse path data from string including fine-grained normalization options. This script aims to provide a performant and compact parser – respecting all possible minified/shorthand notations.

## Usage Browser

``` lang-html

<script src=""></script>

```


``` lang-js
const d ="m 0 0 .5.5.5.5a 5 10 45 1040 20" 
parsepathDataNormalized(d)
```


## Pathdata structure/notation

This library is based on the [w3C SVGPathData interface draft](https://svgwg.org/specs/paths/#InterfaceSVGPathData).

The returned path data parsed from a stringified pathdata `d` attribute string is an array representing each command as an object like so:  

``` lang-js
const d ="m 0 0 .5.5.5.5a 5 10 45 1040 20" 
parsepathDataNormalized(d)
```

``` lang-js
[
    {"type":"M","values":[0,0]},
    {"type":"L","values":[0.5,0.5]},
    {"type":"L","values":[1,1]},
    {"type":"A","values":[5,10,45,1,0,41,21]}
]
```

The above example illustrates a problem with overly "lightweight" path parsers:  
We need an extra check to "unravel" the `A` arcto's `largeArc` and `sweep` flags, which are concatenated with the subsequent on-path x coordinate value.

## Normalization
Normalization (admittedly slightly ambigious) via `parsepathDataNormalized(d)` applies by default these conversions:  
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


### Recommendations
* Quadratic béziers usually provide much faster calculations/algorithms – think twice before converting to cubic.
* `debug:true` can be handy if you need to find errors in malformed pathdata – maybe caused by manual path splitting
* Arc to cubic conversion/approximation is quite complex and thus quite expensive – you may not need this conversion


## Credits

* Jarek Foksa for his [great polyfill](https://github.com/jarek-foksa/path-data-polyfill) heavily inspring to adopt the new pathData interface methodology and for contributing to the specification
* Dmitry Baranovskiy for (raphael.j/snap.svg) [pathToAbsolute/Relative functions](https://github.com/DmitryBaranovskiy/raphael/blob/master/raphael.js#L1848) 
* Vitaly Puzrin (fontello) for the arc to cubic conversion method  [a2c.js](https://github.com/fontello/svgpath/blob/master/lib/a2c.js)
* Mike "POMAX" Kammermans for his great [A Primer on Bézier Curves](https://pomax.github.io/bezierinfo)



