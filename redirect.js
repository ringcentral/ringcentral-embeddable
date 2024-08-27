/*! For license information please see redirect.js.LICENSE.txt */
!function(){var t={612767:function(t,e,r){var n;t=r.nmd(t),function(s){e&&e.nodeType,t&&t.nodeType;var o="object"==typeof r.g&&r.g;o.global!==o&&o.window!==o&&o.self;var h,a=2147483647,i=36,c=/^xn--/,l=/[^\x20-\x7E]/,u=/[\x2E\u3002\uFF0E\uFF61]/g,p={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},f=Math.floor,m=String.fromCharCode;function d(t){throw RangeError(p[t])}function v(t,e){for(var r=t.length,n=[];r--;)n[r]=e(t[r]);return n}function g(t,e){var r=t.split("@"),n="";return r.length>1&&(n=r[0]+"@",t=r[1]),n+v((t=t.replace(u,".")).split("."),e).join(".")}function w(t){for(var e,r,n=[],s=0,o=t.length;s<o;)(e=t.charCodeAt(s++))>=55296&&e<=56319&&s<o?56320==(64512&(r=t.charCodeAt(s++)))?n.push(((1023&e)<<10)+(1023&r)+65536):(n.push(e),s--):n.push(e);return n}function y(t){return v(t,(function(t){var e="";return t>65535&&(e+=m((t-=65536)>>>10&1023|55296),t=56320|1023&t),e+=m(t)})).join("")}function b(t,e){return t+22+75*(t<26)-((0!=e)<<5)}function x(t,e,r){var n=0;for(t=r?f(t/700):t>>1,t+=f(t/e);t>455;n+=i)t=f(t/35);return f(n+36*t/(t+38))}function j(t){var e,r,n,s,o,h,c,l,u,p,m,v=[],g=t.length,w=0,b=128,j=72;for((r=t.lastIndexOf("-"))<0&&(r=0),n=0;n<r;++n)t.charCodeAt(n)>=128&&d("not-basic"),v.push(t.charCodeAt(n));for(s=r>0?r+1:0;s<g;){for(o=w,h=1,c=i;s>=g&&d("invalid-input"),((l=(m=t.charCodeAt(s++))-48<10?m-22:m-65<26?m-65:m-97<26?m-97:i)>=i||l>f((a-w)/h))&&d("overflow"),w+=l*h,!(l<(u=c<=j?1:c>=j+26?26:c-j));c+=i)h>f(a/(p=i-u))&&d("overflow"),h*=p;j=x(w-o,e=v.length+1,0==o),f(w/e)>a-b&&d("overflow"),b+=f(w/e),w%=e,v.splice(w++,0,b)}return y(v)}function O(t){var e,r,n,s,o,h,c,l,u,p,v,g,y,j,O,C=[];for(g=(t=w(t)).length,e=128,r=0,o=72,h=0;h<g;++h)(v=t[h])<128&&C.push(m(v));for(n=s=C.length,s&&C.push("-");n<g;){for(c=a,h=0;h<g;++h)(v=t[h])>=e&&v<c&&(c=v);for(c-e>f((a-r)/(y=n+1))&&d("overflow"),r+=(c-e)*y,e=c,h=0;h<g;++h)if((v=t[h])<e&&++r>a&&d("overflow"),v==e){for(l=r,u=i;!(l<(p=u<=o?1:u>=o+26?26:u-o));u+=i)O=l-p,j=i-p,C.push(m(b(p+O%j,0))),l=f(O/j);C.push(m(b(l,0))),o=x(r,y,n==s),r=0,++n}++r,++e}return C.join("")}h={version:"1.3.2",ucs2:{decode:w,encode:y},decode:j,encode:O,toASCII:function(t){return g(t,(function(t){return l.test(t)?"xn--"+O(t):t}))},toUnicode:function(t){return g(t,(function(t){return c.test(t)?j(t.slice(4).toLowerCase()):t}))}},void 0===(n=function(){return h}.call(e,r,e,t))||(t.exports=n)}()},939154:function(t){"use strict";function e(t,e){return Object.prototype.hasOwnProperty.call(t,e)}t.exports=function(t,r,n,s){r=r||"&",n=n||"=";var o={};if("string"!=typeof t||0===t.length)return o;var h=/\+/g;t=t.split(r);var a=1e3;s&&"number"==typeof s.maxKeys&&(a=s.maxKeys);var i=t.length;a>0&&i>a&&(i=a);for(var c=0;c<i;++c){var l,u,p,f,m=t[c].replace(h,"%20"),d=m.indexOf(n);d>=0?(l=m.substr(0,d),u=m.substr(d+1)):(l=m,u=""),p=decodeURIComponent(l),f=decodeURIComponent(u),e(o,p)?Array.isArray(o[p])?o[p].push(f):o[p]=[o[p],f]:o[p]=f}return o}},629513:function(t){"use strict";var e=function(t){switch(typeof t){case"string":return t;case"boolean":return t?"true":"false";case"number":return isFinite(t)?t:"";default:return""}};t.exports=function(t,r,n,s){return r=r||"&",n=n||"=",null===t&&(t=void 0),"object"==typeof t?Object.keys(t).map((function(s){var o=encodeURIComponent(e(s))+n;return Array.isArray(t[s])?t[s].map((function(t){return o+encodeURIComponent(e(t))})).join(r):o+encodeURIComponent(e(t[s]))})).join(r):s?encodeURIComponent(e(s))+n+encodeURIComponent(e(t)):""}},243986:function(t,e,r){"use strict";e.decode=e.parse=r(939154),e.encode=e.stringify=r(629513)},327254:function(t,e,r){"use strict";var n=r(612767),s=r(463865);function o(){this.protocol=null,this.slashes=null,this.auth=null,this.host=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.query=null,this.pathname=null,this.path=null,this.href=null}e.parse=y,e.resolve=function(t,e){return y(t,!1,!0).resolve(e)},e.resolveObject=function(t,e){return t?y(t,!1,!0).resolveObject(e):e},e.format=function(t){s.isString(t)&&(t=y(t));return t instanceof o?t.format():o.prototype.format.call(t)},e.Url=o;var h=/^([a-z0-9.+-]+:)/i,a=/:[0-9]*$/,i=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,c=["{","}","|","\\","^","`"].concat(["<",">",'"',"`"," ","\r","\n","\t"]),l=["'"].concat(c),u=["%","/","?",";","#"].concat(l),p=["/","?","#"],f=/^[+a-z0-9A-Z_-]{0,63}$/,m=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,d={javascript:!0,"javascript:":!0},v={javascript:!0,"javascript:":!0},g={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0},w=r(243986);function y(t,e,r){if(t&&s.isObject(t)&&t instanceof o)return t;var n=new o;return n.parse(t,e,r),n}o.prototype.parse=function(t,e,r){if(!s.isString(t))throw new TypeError("Parameter 'url' must be a string, not "+typeof t);var o=t.indexOf("?"),a=-1!==o&&o<t.indexOf("#")?"?":"#",c=t.split(a);c[0]=c[0].replace(/\\/g,"/");var y=t=c.join(a);if(y=y.trim(),!r&&1===t.split("#").length){var b=i.exec(y);if(b)return this.path=y,this.href=y,this.pathname=b[1],b[2]?(this.search=b[2],this.query=e?w.parse(this.search.substr(1)):this.search.substr(1)):e&&(this.search="",this.query={}),this}var x=h.exec(y);if(x){var j=(x=x[0]).toLowerCase();this.protocol=j,y=y.substr(x.length)}if(r||x||y.match(/^\/\/[^@\/]+@[^@\/]+/)){var O="//"===y.substr(0,2);!O||x&&v[x]||(y=y.substr(2),this.slashes=!0)}if(!v[x]&&(O||x&&!g[x])){for(var C,A,I=-1,q=0;q<p.length;q++){-1!==(U=y.indexOf(p[q]))&&(-1===I||U<I)&&(I=U)}-1!==(A=-1===I?y.lastIndexOf("@"):y.lastIndexOf("@",I))&&(C=y.slice(0,A),y=y.slice(A+1),this.auth=decodeURIComponent(C)),I=-1;for(q=0;q<u.length;q++){var U;-1!==(U=y.indexOf(u[q]))&&(-1===I||U<I)&&(I=U)}-1===I&&(I=y.length),this.host=y.slice(0,I),y=y.slice(I),this.parseHost(),this.hostname=this.hostname||"";var k="["===this.hostname[0]&&"]"===this.hostname[this.hostname.length-1];if(!k)for(var R=this.hostname.split(/\./),S=(q=0,R.length);q<S;q++){var E=R[q];if(E&&!E.match(f)){for(var N="",F=0,$=E.length;F<$;F++)E.charCodeAt(F)>127?N+="x":N+=E[F];if(!N.match(f)){var L=R.slice(0,q),M=R.slice(q+1),T=E.match(m);T&&(L.push(T[1]),M.unshift(T[2])),M.length&&(y="/"+M.join(".")+y),this.hostname=L.join(".");break}}}this.hostname.length>255?this.hostname="":this.hostname=this.hostname.toLowerCase(),k||(this.hostname=n.toASCII(this.hostname));var z=this.port?":"+this.port:"",H=this.hostname||"";this.host=H+z,this.href+=this.host,k&&(this.hostname=this.hostname.substr(1,this.hostname.length-2),"/"!==y[0]&&(y="/"+y))}if(!d[j])for(q=0,S=l.length;q<S;q++){var K=l[q];if(-1!==y.indexOf(K)){var P=encodeURIComponent(K);P===K&&(P=escape(K)),y=y.split(K).join(P)}}var V=y.indexOf("#");-1!==V&&(this.hash=y.substr(V),y=y.slice(0,V));var Z=y.indexOf("?");if(-1!==Z?(this.search=y.substr(Z),this.query=y.substr(Z+1),e&&(this.query=w.parse(this.query)),y=y.slice(0,Z)):e&&(this.search="",this.query={}),y&&(this.pathname=y),g[j]&&this.hostname&&!this.pathname&&(this.pathname="/"),this.pathname||this.search){z=this.pathname||"";var _=this.search||"";this.path=z+_}return this.href=this.format(),this},o.prototype.format=function(){var t=this.auth||"";t&&(t=(t=encodeURIComponent(t)).replace(/%3A/i,":"),t+="@");var e=this.protocol||"",r=this.pathname||"",n=this.hash||"",o=!1,h="";this.host?o=t+this.host:this.hostname&&(o=t+(-1===this.hostname.indexOf(":")?this.hostname:"["+this.hostname+"]"),this.port&&(o+=":"+this.port)),this.query&&s.isObject(this.query)&&Object.keys(this.query).length&&(h=w.stringify(this.query));var a=this.search||h&&"?"+h||"";return e&&":"!==e.substr(-1)&&(e+=":"),this.slashes||(!e||g[e])&&!1!==o?(o="//"+(o||""),r&&"/"!==r.charAt(0)&&(r="/"+r)):o||(o=""),n&&"#"!==n.charAt(0)&&(n="#"+n),a&&"?"!==a.charAt(0)&&(a="?"+a),e+o+(r=r.replace(/[?#]/g,(function(t){return encodeURIComponent(t)})))+(a=a.replace("#","%23"))+n},o.prototype.resolve=function(t){return this.resolveObject(y(t,!1,!0)).format()},o.prototype.resolveObject=function(t){if(s.isString(t)){var e=new o;e.parse(t,!1,!0),t=e}for(var r=new o,n=Object.keys(this),h=0;h<n.length;h++){var a=n[h];r[a]=this[a]}if(r.hash=t.hash,""===t.href)return r.href=r.format(),r;if(t.slashes&&!t.protocol){for(var i=Object.keys(t),c=0;c<i.length;c++){var l=i[c];"protocol"!==l&&(r[l]=t[l])}return g[r.protocol]&&r.hostname&&!r.pathname&&(r.path=r.pathname="/"),r.href=r.format(),r}if(t.protocol&&t.protocol!==r.protocol){if(!g[t.protocol]){for(var u=Object.keys(t),p=0;p<u.length;p++){var f=u[p];r[f]=t[f]}return r.href=r.format(),r}if(r.protocol=t.protocol,t.host||v[t.protocol])r.pathname=t.pathname;else{for(var m=(t.pathname||"").split("/");m.length&&!(t.host=m.shift()););t.host||(t.host=""),t.hostname||(t.hostname=""),""!==m[0]&&m.unshift(""),m.length<2&&m.unshift(""),r.pathname=m.join("/")}if(r.search=t.search,r.query=t.query,r.host=t.host||"",r.auth=t.auth,r.hostname=t.hostname||t.host,r.port=t.port,r.pathname||r.search){var d=r.pathname||"",w=r.search||"";r.path=d+w}return r.slashes=r.slashes||t.slashes,r.href=r.format(),r}var y=r.pathname&&"/"===r.pathname.charAt(0),b=t.host||t.pathname&&"/"===t.pathname.charAt(0),x=b||y||r.host&&t.pathname,j=x,O=r.pathname&&r.pathname.split("/")||[],C=(m=t.pathname&&t.pathname.split("/")||[],r.protocol&&!g[r.protocol]);if(C&&(r.hostname="",r.port=null,r.host&&(""===O[0]?O[0]=r.host:O.unshift(r.host)),r.host="",t.protocol&&(t.hostname=null,t.port=null,t.host&&(""===m[0]?m[0]=t.host:m.unshift(t.host)),t.host=null),x=x&&(""===m[0]||""===O[0])),b)r.host=t.host||""===t.host?t.host:r.host,r.hostname=t.hostname||""===t.hostname?t.hostname:r.hostname,r.search=t.search,r.query=t.query,O=m;else if(m.length)O||(O=[]),O.pop(),O=O.concat(m),r.search=t.search,r.query=t.query;else if(!s.isNullOrUndefined(t.search)){if(C)r.hostname=r.host=O.shift(),(k=!!(r.host&&r.host.indexOf("@")>0)&&r.host.split("@"))&&(r.auth=k.shift(),r.host=r.hostname=k.shift());return r.search=t.search,r.query=t.query,s.isNull(r.pathname)&&s.isNull(r.search)||(r.path=(r.pathname?r.pathname:"")+(r.search?r.search:"")),r.href=r.format(),r}if(!O.length)return r.pathname=null,r.search?r.path="/"+r.search:r.path=null,r.href=r.format(),r;for(var A=O.slice(-1)[0],I=(r.host||t.host||O.length>1)&&("."===A||".."===A)||""===A,q=0,U=O.length;U>=0;U--)"."===(A=O[U])?O.splice(U,1):".."===A?(O.splice(U,1),q++):q&&(O.splice(U,1),q--);if(!x&&!j)for(;q--;q)O.unshift("..");!x||""===O[0]||O[0]&&"/"===O[0].charAt(0)||O.unshift(""),I&&"/"!==O.join("/").substr(-1)&&O.push("");var k,R=""===O[0]||O[0]&&"/"===O[0].charAt(0);C&&(r.hostname=r.host=R?"":O.length?O.shift():"",(k=!!(r.host&&r.host.indexOf("@")>0)&&r.host.split("@"))&&(r.auth=k.shift(),r.host=r.hostname=k.shift()));return(x=x||r.host&&O.length)&&!R&&O.unshift(""),O.length?r.pathname=O.join("/"):(r.pathname=null,r.path=null),s.isNull(r.pathname)&&s.isNull(r.search)||(r.path=(r.pathname?r.pathname:"")+(r.search?r.search:"")),r.auth=t.auth||r.auth,r.slashes=r.slashes||t.slashes,r.href=r.format(),r},o.prototype.parseHost=function(){var t=this.host,e=a.exec(t);e&&(":"!==(e=e[0])&&(this.port=e.substr(1)),t=t.substr(0,t.length-e.length)),t&&(this.hostname=t)}},463865:function(t){"use strict";t.exports={isString:function(t){return"string"==typeof t},isObject:function(t){return"object"==typeof t&&null!==t},isNull:function(t){return null===t},isNullOrUndefined:function(t){return null==t}}}},e={};function r(n){var s=e[n];if(void 0!==s)return s.exports;var o=e[n]={id:n,loaded:!1,exports:{}};return t[n].call(o.exports,o,o.exports,r),o.loaded=!0,o.exports}r.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"==typeof window)return window}}(),r.nmd=function(t){return t.paths=[],t.children||(t.children=[]),t},function(){"use strict";var t=r(327254);const e=["https://ringcentral.github.io","https://apps.ringcentral.com"];e.indexOf(window.location.origin)<0&&e.push(window.location.origin);new class{constructor(){let{prefix:r}=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{};window.addEventListener("load",(()=>{const n=window.location.href;try{if(window.opener&&window.opener.oAuthCallback)return window.opener.oAuthCallback(n),void window.close()}catch(t){}try{window.opener&&window.opener.postMessage&&(e.forEach((t=>{window.opener.postMessage({callbackUri:n},t)})),window.close())}catch(t){console.error(t)}try{window.parent&&window.parent!==window&&("SSOIframe"===window.name?e.forEach((t=>{window.parent.postMessage({callbackUri:n},t)})):e.forEach((t=>{window.parent.postMessage({refreshCallbackUri:n},t)})))}catch(t){console.error(t)}const{query:{state:s}}=t.parse(n,!0);if(!s)return;const o=s.split("-").slice(1).join("-"),h=`${r}-${o}-redirect-callbackUri`;localStorage.removeItem(h),window.addEventListener("storage",(t=>{t.key!==h||t.newValue&&""!==t.newValue||window.close()})),localStorage.setItem(h,n)}))}}({prefix:"rc-widget"})}()}();
//# sourceMappingURL=redirect.js.map