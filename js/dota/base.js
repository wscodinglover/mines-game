(function(){
		  
  var undefined = 'undefined', cache = {};
    
  var $ = DOTA = {
    v : 1.1,
    path : '',
    $ : function(id){
      return "string" == typeof id ? document.getElementById(id) : id;
    },
    alias : function(name){
      if(cache[name]){
        return;
      }
      if(typeof window[name] != undefined){
        throw("'" + name + "' The alias already exists...");
      }
      window[name] = $;
      cache[name] = true;
    },
    extend : function(dest, sour){
      if(arguments.length == 1){
        sour = dest;
        dest = this;
      }
      for(var property in sour){
        dest[property] = sour[property];
      }
      return dest;
    },
    each : function(arr, fn){
      for(var i = 0; i < arr.length; i++){
        fn.call(this, arr[i]);
      }
    },
    getPath : function(){
      var scripts = document.getElementsByTagName("script");
      for(var i = 0; i < scripts.length; i++){
        var src = scripts[i].src;
        if(/\/base.js/i.test(src)){
          this.path = src.replace(/base.js.*?/i, "");
          return;
        }
      };
      throw("path not found!");
    },
    include : function(url, append, callback){
      if(cache[url]){
        return;
      }
      if(this.path == ''){
        this.getPath();
      }
      if(url.indexOf("/") <= 0){
        url = this.path + url;
      }
      if(append){
        var script = document.createElement("script");
        script.type = "text/javascript";
        if(callback){
          script.onload = script.onreadystatechange = function(){
            if(script.readyState && script.readyState != "loaded" && script.readyState != "complete"){
              return;
            }
            callback();
            script.onload = script.onreadystatechange = null;
          };				
        }
        script.src = url;
        document.getElementsByTagName("head")[0].appendChild(script);
      }else{
        url = $.string.format("<{0} type='text/java{0}' src='{1}'></{0}>", "script", url);
        document.write(url);
      }
      cache[url] = true;
    }
  };
  
  $.string = function(str){
    return {	
      trim : function(){
        return str.replace(/^\s+|\s+$/g, "");
      },
      ltrim : function(){
        return str.replace(/^\s+/g, "");
      },
      rtrim : function(){
        return str.replace(/\s+$/g, "");
      },
      pad : function(num, space){
        return (new Array(num+1).join(space || " ") + str).slice(-num);
      }
    };
  };
  $.extend($.string, {
     format : function(fmt){
      var args = arguments
      return fmt.replace(/\{\d+\}/g, function(v){
        return args[parseInt(v.match(/\d+/)) + 1];
      });
    }
  });
  
  $.date = function(date){
    date = date || new Date();
    var o = {
      y : date.getFullYear(), 
      M : date.getMonth()+1, 
      d : date.getDate(), 
      h : date.getHours(), 
      m : date.getMinutes(), 
      s : date.getSeconds()
    };
    return {
      json : function(){
        return o;
      },
      format : function(fmt){
        return fmt.replace(/y+|M+|d+|h+|m+|s+/g, function(v){return ("0" + o[v.charAt(0)]).slice(-v.length);} );
      },
      today : function(){
        return $.string.format("{0}\u5e74{1}\u6708{2}\u65e5", o.y, o.M, o.d);
      }
    }
  };
  
  $.dom = function(element){
    var el = $.$(element || document);
    return {
      currentStyle : function(){
        return el.currentStyle || document.defaultView.getComputedStyle(el, null);
      },
      offset : function(parent){
        if(el != document){
          var x = 0, y = 0, obj = el;
          parent = parent || document.body;
          do{
            x += obj.offsetLeft;
            y += obj.offsetTop;
            
            obj = obj.offsetParent;
          }while(obj && obj != parent);
          return {
            x	   : x,
            y	   : y,
            left   : x,
            top	   : y,
            width  : el.offsetWidth,
            height : el.offsetHeight
          };
        }else{
          return {
            left   : document.documentElement.offsetLeft || document.body.offsetLeft || 0,
            top    : document.documentElement.offsetTop || document.body.offsetTop || 0,
            width  : document.documentElement.offsetWidth || document.body.offsetWidth || 0,
            height : document.documentElement.offsetHeight || document.body.offsetHeight || 0
          };
        }
      },
      client : function(){
        return {
          width  : document.documentElement.clientWidth || document.body.clientWidth || 0,
          height : document.documentElement.clientHeight || document.body.clientHeight || 0
        };
      },
      scroll : function(){
        if(el != document){
          return {
            left  : el.scrollLeft,
            top	  : el.scrollTop,
            width : el.scrollWidth,
            height: el.scrollHeight
          }
        }else{
          return {
            left  : document.documentElement.scrollLeft || document.body.scrollLeft || 0,
            top	  : document.documentElement.scrollTop || document.body.scrollTop || 0,
            width : Math.max(document.documentElement.scrollWidth || document.body.scrollWidth ) || 0,
            height: Math.max(document.documentElement.scrollHeight, document.body.scrollHeight) || 0
          }
        }
      },
      width : function(val){
        if(typeof val != undefined){
          el.style.width = val + "px";
        }else{
          var w = parseInt(this.currentStyle(el).width);
          return isNaN(w) ? 0 : w;
        }
      },
      height : function(val){
        if(typeof val != undefined){
          el.style.height = val + "px";
        }else{
          var h = parseInt(this.currentStyle(el).height);
          return isNaN(h) ? 0 : h;
        }
      },
      html : function(val){
        if(typeof val != undefined){
          el.innerHTML = val;
        }else{
          return el.innerHTML;
        }
      },
      text : function(element){
        if(typeof element == undefined){
          element = el;
        }
        if($.browser.ie){
          return el.innerText;
        }
        var ret = "", node;
        for(var i = 0; i < element.childNodes.length; i++){
          node = element.childNodes[i];
          ret += (node.nodeType == 3 ? node.nodeValue : this.text(node));
        }
        return ret;
      },
      setOpacity : function(opacity){
        var b = $.browser;		
        if( b.ie ){
          el.style.filter = opacity == 100 ? "" : "alpha(opacity=" + opacity + ")";
        }else if( b.safari ){
          el.style.KhtmlOpacity = opacity / 100;
        }else if( b.firefox ){
          el.style.MozOpacity = opacity / 100;
        }else{
          el.style.opacity = opacity / 100;
        }
      },
      getOpacity : function(){
        var b = $.browser, ret = 100;		
        if( b.ie ){
          if(/alpha\(opacity\s*=\s*(\d+)\)/i.test(el.style.filter)){
            ret = parseInt(RegExp.$1);
          }
        }else if( b.safari ){
          if(el.style.KhtmlOpacity != ""){
            ret = el.style.KhtmlOpacity * 100;
          }
        }else if( b.firefox ){
          if(el.style.MozOpacity != ""){
            ret = el.style.MozOpacity * 100;
          }
        }else{
          if(el.style.opacity != ""){
            ret = el.style.opacity * 100;
          }
        }
        return (isNaN(ret) ? 100 : ret);
      },
      firstNode : function(){
        var next = el.firstChild;
        while(next && next.nodeType != 1){
          next = next.nextSibling;
        }
        return next;
      },
      nextNode : function(){
        var next = el.nextSibling;
        while(next && next.nodeType != 1){
          next = next.nextSibling;
        }
        return next;
      },
      findParent : function(tagName){
        var p = el.parentNode;
        while(p && p.tagName.toLowerCase() != tagName.toLowerCase()){
          p = p.parentNode;
        }
        return p;
      }
    };
  };
  
  //CSS类, 动态添加CSS
  $.css = {
    add : function(el, css){
      el = $.$(el);
      cls = el.className;
      if(cls == ""){
        el.className = css;
      }else{
        if(!this.has(el, css)){
          el.className += " " + css;
        }
      }
    },
    remove : function(el, css){
      if(this.has(el, css)){
        el = $.$(el);
        el.className = el.className.replace(css, "").replace(/\s{2,}/, " ");
      }
    },
    has : function(el, css){
      if(new RegExp("(\\b|\\s)" + css + "(\\b|\\s)").test($.$(el).className)){
        return true;
      }
      return false;
    },
    toggle : function(el, css){
      if(this.has(el, css)){
        this.remove(el, css);
      }else{
        this.add(el, css);
      }
    },
    addStyle : function(cssText, doc){
      doc = doc || document;
      var style = null, 
        styles = doc.getElementsByTagName("head")[0].getElementsByTagName("style");	
      if(styles && styles.length == 0){
        style = doc.createElement("style");
        style.type = "text/css";
        doc.getElementsByTagName("head")[0].appendChild(style);
      }else{
        style = styles[0];
      }
      if(style.styleSheet){
        style.styleSheet.cssText += cssText;
      }else{
        style.appendChild(doc.createTextNode(cssText));
      }
    },
    include : function(url, append){
      if(cache[url]){
        return;
      }
      if(this.path == ''){
        this.getPath();
      }
      if(url.indexOf("/") <= 0){
        url = this.path + url;
      }
      if(append){
        var style = document.createElement("link");
        style.type = "text/css";
        style.rel = "stylesheet";
        style.href = url;
        document.getElementsByTagName("head")[0].appendChild(style);
      }else{
        url = $.string.format("<link rel='stylesheet' type='text/css' href='{0}'/>", url);
        document.write(url);
      }
      cache[url] = true;
    }
  };
  
  $.browser = (function(){
    var Sys = {};
    var ua = navigator.userAgent.toLowerCase();
    if (window.ActiveXObject)
      Sys.ie = ua.match(/msie ([\d.]+)/)[1];
    else if (/firefox/.test(ua))
      Sys.firefox = ua.match(/firefox\/([\d.]+)/)[1];
    else if (/chrome/.test(ua))
      Sys.chrome = ua.match(/chrome\/([\d.]+)/)[1];
    else if (window.opera)
      Sys.opera = ua.match(/opera.([\d.]+)/)[1];
    else if (window.openDatabase)
      Sys.safari = ua.match(/version\/([\d.]+)/)[1];
    return Sys;
  })();
  
  $.cookie = {
    set : function(name,value){
      var Days = 365, exp  = new Date();    //new Date("December 31, 9998");
      exp.setTime(exp.getTime() + Days*24*60*60*1000);
      document.cookie = name + "="+ escape (value) + ";expires=" + exp.toGMTString();
    },
    get: function(name){//取cookies函数        
      var arr = document.cookie.match(new RegExp("(^| )"+name+"=([^;]*)(;|$)"));
      if(arr != null) 
        return unescape(arr[2]); 
      return null;
    },
    del: function(name){//删除cookie
      var exp = new Date();
      exp.setTime(exp.getTime() - 1);
      var cval=getCookie(name);
      if(cval!=null) document.cookie= name + "="+cval+";expires="+exp.toGMTString();
    }
  }
  
  //事件处理对象
  $.event = {
    bind : function(object, fun){
      return function(){
        return fun.apply(object, arguments);
      }
    },
    bindEvent : function(object, fun) {
      var args = Array.prototype.slice.call(arguments).slice(2);
      return function(event) {
        return fun.apply(object, [$.event.formatEvent(event || window.event)].concat(args));
      }
    },
    addEvent : function(oTarget, sEventType, fnHandler){
      if( oTarget.addEventListener){
        oTarget.addEventListener(sEventType, fnHandler, false);
      }else if( oTarget.attachEvent ){
        oTarget.attachEvent("on" + sEventType, fnHandler);
      }else{
        oTarget["on" + sEventType] = fnHandler;
      }
    },
    removeEvent : function(oTarget, sEventType, fnHandler){
      if( oTarget.removeEventListener){
        oTarget.removeEventListener(sEventType, fnHandler, false);
      }else if( oTarget.detachEvent ){
        oTarget.detachEvent("on" + sEventType, fnHandler);
      }else{
        oTarget["on" + sEventType] = null;
      }
    },
    formatEvent : function(oEvent){
      if($.browser.ie){
        try{
          oEvent.charCode = ( oEvent.type == "keypress" ) ? oEvent.keyCode : 0;
          oEvent.eventPhase = 2;
          oEvent.isChar = ( oEvent.charCode > 0 );
          var scr = $.dom().scroll();
          oEvent.pageX = oEvent.clientX + scr.left;
          oEvent.pageY = oEvent.clientY + scr.top;
          oEvent.preventDefault = function(){
            this.returnValue = false;
          };
          
          if( oEvent.type == "mouseout" ){
            oEvent.relatedTarget = oEvent.toElement;
          }else if( oEvent.type == "mouseover" ){
            oEvent.relatedTarget = oEvent.fromElement;
          }
          
          oEvent.stopPropagation = function(){
            this.cancelBubble = true;
          };
          
          oEvent.target = oEvent.srcElement;
          oEvent.time = (new Date()).getTime();
        }catch(e){}
      }
      
      return oEvent;
    },
    getEvent : function(){
      if( window.event ){
        return this.formatEvent(window.event);
      }else{
        return $.event.getEvent.caller.arguments[0];
      }
    }
  };
    
  })();