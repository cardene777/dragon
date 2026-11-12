var u=/^\d[\d,]*(?:\.\d+)?/u;function d(n){const o=n===void 0?null:u.exec(n);return o?Number(o[0].replaceAll(",","")):void 0}export{d as a};
