(function(){
  var $ = DOTA;
  
  $.include("drag.js");
  $.include("toolbar.js");
  $.include("button.js");
  $.include("animation.js");
  
  DOTA.WindowMgr = {
    activeWindow : null,
    maxzIndex : 0,
    register : function(pWin, zIndex){
      this.maxzIndex = Math.max(this.maxzIndex, zIndex);
    },
    getzIndex : function(pWin){
      if(pWin !== this.activeWindow){
        this.maxzIndex++;
      }
      return this.maxzIndex;
    }
  };
  
  DOTA.BorderStyle = {
    normal : 1,
    dialog : 2
  };
  
  DOTA.Window = function(config){	
    var width = $.dom().offset().width;
    var height = $.dom().offset().height;
  
    this.config = $.extend({
      parent	: document.body,
      title 	: "窗口标题",
      left 	: (width - 400) / 2,
      top 	: (height - 300) / 2,
      width 	: 400,
      height 	: 300,
      zIndex 	: 1000,
      animate : ($.browser.ie ? false : true) && DOTA.Animation,
      content : "窗口内容",
      isShow	: true,
      isClear	: true,
      isInit	: true,
      isShowMask : false,
      isRegister : false,
      opacity : 50,
      contentPadding : 2,
      transparent	: false,
      borderStyle	: $.BorderStyle.normal,
      url 	: "",
      onLoad 	: function(){},
      onMin	: function(){},
      onUnLoad : function(){}
    }, config || {});
    
    if(this.config.isInit){
      this.init();
    }
  };
  
  DOTA.Window.prototype = {
    init : function(){
      this.initHtml();
      this.initPosition();
      this.resize();
      this.initEvent();
      
      this.toolBar = DOTA.ToolBar ? new DOTA.ToolBar(this._toolBar) : null;
      this.animate = DOTA.Animation ? new DOTA.Animation({element: this._window, css: "d_window_movebg"}) : null;
      this.config.onLoad();
      
      if(this.config.isShow){
        this.show();
      }else{
        this._window.style.display = "none";
      }
      
      if(!this.config.isRegister){
        DOTA.WindowMgr.register(this, this.config.zIndex);
      }
    },
    initHtml : function(){
      var o = this.config;
      
      var v = this.Window = this._window = document.createElement("div");
      v.className = "d_window";
      v.style.zIndex = o.zIndex;
      
      var bd = this._border = document.createElement("div");
      bd.className = "border";
      
      var tc = this._titleContainer = document.createElement("div");
      tc.className = "titleContainer";
      
      var t = this._title = document.createElement("div");
      t.className = "title";
      t.innerHTML = o.title;
      
      var c = this._closeButton = document.createElement("div");
      c.className = "button";
      this.CloseButton = new DOTA.Button({text:"", className:["d_button", "d_button", "d_button_down"]});
      this.CloseButton.renderTo(c);
      
      if(o.borderStyle == $.BorderStyle.normal){
        var x = this._maxButton = document.createElement("div");
        x.className = "button maxButton";
        this.MaxButton = new DOTA.Button({text:"", className:["d_xbutton", "d_xbutton", "d_button_down"]});
        this.MaxButton.renderTo(x);
        
        var m = this._minButton = document.createElement("div");
        m.className = "button minButton";
        this.MinButton = new DOTA.Button({text:"", className:["d_mbutton", "d_mbutton", "d_button_down"]});
        this.MinButton.renderTo(m);
      }
      
      var cb = this._closeButton_border = document.createElement("div");
      cb.className = "button_border";
      
      
      var tool = this._toolBar = document.createElement("div");
      tool.style.display = "none";
      
      var b = this._content = document.createElement("div");
      b.className = "content";
      b.style.padding = o.contentPadding + "px";
      if( o.url ){
        this.loadUrl(o.url);
      }else{
        b.innerHTML = o.content;
      }
      
      document.body.appendChild(v);
      bd.appendChild(tc);
      bd.appendChild(tool);
      tc.appendChild(t);
      cb.appendChild(c);
      if(o.borderStyle == $.BorderStyle.normal){
        cb.appendChild(x);
        cb.appendChild(m);
      }
      tc.appendChild(cb);
      bd.appendChild(b);
      v.appendChild(bd);
    },
    initPosition : function(){
      var o = this.config, v = this._window, c = this._content, t = this._titleContainer;
      v.style.left = o.left + "px";
      v.style.top = o.top + "px";
      v.style.width = o.width + "px";
      v.style.height = o.height + "px";		
    },
    resize : function(){
      var o = this.config, v = this._window, c = this._content, t = this._titleContainer;
      var th = this.toolBar ? this.toolBar.getHeight() : 0;
      var sh = this.statusBar ? this.statusBar.getHeight() : 0;
      //alert(th);
      var hei = o.height - parseInt($.dom(t).currentStyle().height) - th - sh - o.contentPadding * 2 - 6;
      c.style.height = hei + "px";	
      if( o.url ){
        if( !$.browser.ie ){
          hei -= 4;
        }
        c.getElementsByTagName("iframe")[0].style.height = hei + "px";
      }
    },
    resizeTo : function(width, height){
      var isMove = arguments.length > 2 ? arguments[2] : true;
      var o = this.config;
      o.width = width, o.height = height;
      if(isMove){
        var offset = $.dom().offset();
        o.left = (offset.width - width) / 2;
        o.top = (offset.height - height) / 2;
        this.initPosition();
      }
      this.resize();
    },
    initEvent : function(){
      var evt = $.event, v = this._window, btn = this._closeButton, tc = this._title;
      
      this._onCloseMouseOver = evt.bindEvent(this, this.onCloseMouseOver);
      this._onCloseMouseOut = evt.bindEvent(this, this.onCloseMouseOut);
      this._onCloseClick = evt.bindEvent(this, this.onCloseClick)
      this._onMouseDown = evt.bindEvent(this, this.onMouseDown);
      
      //evt.addEvent(btn, "mouseover", this._onCloseMouseOver);
      //evt.addEvent(btn, "mouseout", this._onCloseMouseOut);
      evt.addEvent(btn, "click", this._onCloseClick);
      
      evt.addEvent(v, "mousedown", this._onMouseDown);
      
      this.drag = new DOTA.Drag(v, {handle : tc, cancelBubble: false, transparent: this.config.transparent });
    },
    showOverLayer : function(){
      //显示遮罩层
      var l = this._overLayer, o = this.config;
      if( o.isShowMask ){
        if( !this._overLayer ){
          l = this._overLayer = document.createElement("div");
          l.className = "d_overlayer";
          l.style.zIndex = o.zIndex - 1;
          $.dom(l).setOpacity(o.opacity);
          
          document.body.appendChild(l);
        }
        var scr = $.dom().client();
        l.style.width = scr.width + "px";
        l.style.height = scr.height + "px";
        l.style.display = "block";
      }
    },
    onMouseDown : function(){
      if(!this.config.isShowMask){
        //this._window.style.zIndex = DOTA.WindowMgr.getzIndex(this);
      }
    },
    onCloseMouseOver : function(){
      this._closeButton.className = "hover";
    },
    onCloseMouseOut : function(){
      this._closeButton.className = "button";
    },
    onCloseClick : function(){
      if(this.config.isClear){
        this.config.onUnLoad();
        this.dispose();
      }else{
        this.hide();
      }
    },
    setOpacity : function(n){
      $.dom(this._window).setOpacity(n);
    },
    setTitle : function(title){
      this._title.innerHTML = title;
    },
    loadUrl : function(url){
      this.config.url = url;
      this._content.innerHTML = "";
      this._content.innerHTML = "<iframe src='" + url + "' style='background-color:#FFFFFF; margin:0px; padding:0px;' width = '100%' frameborder='0' border='0'></iframe>"
    },
    clearUrl : function(){
      var frame = this._content.getElementsByTagName("iframe");
      if(frame.length > 0){
        frame[0].src = "about:blank";
      }		
    },
    setContent : function(content){
      this._content.innerHTML = content;
    },
    setContentColor : function(foreColor, bgColor){
      if(foreColor){
        this._content.style.color = foreColor;
      }
      if(bgColor){
        this._content.style.backgroundColor = bgColor;
      }
    },
    appendChild : function(element){
      this._content.appendChild(element);
    },
    hide : function(){
      if( this.config.isShowMask && this._overLayer ){
        this._overLayer.style.display = "none";
      }
      if(this.config.animate){
        this.animate.hide();
      }else{
        this._window.style.display = "none";
      }
      if(this.config.url != ""){
        this.clearUrl();
      }
    },
    show : function(){
      this.showOverLayer();
      if(this.config.animate){
        this.animate.show();
      }else{
        this._window.style.display = "block";
      }
    },
    close : function(){
      this.dispose();
    },
    dispose : function(){
      if(!this._window) return;
      
      var evt = DOTA.event, btn = this._closeButton, v = this._window;
      if(arguments.length == 0 && this.config.animate ){
        this.animate.hide(null, evt.bindEvent(this, this.dispose, true));
        return;
      }
      this.drag.dispose();
      this.drag = null;
      this.animate && this.animate.dispose();
      
      evt.removeEvent(btn, "mouseover", this._onCloseMouseOver);
      evt.removeEvent(btn, "mouseout", this._onCloseMouseOut);
      evt.removeEvent(btn, "click", this._onCloseClick);
      
      if( this.toolBar ){
        this.toolBar.dispose();
      }
      
      v.innerHTML = "";
      document.body.removeChild(v);
      if(this._overLayer){
        document.body.removeChild(this._overLayer);
        this._overLayer = null;
      }
      
      this._window = this.Window = null;
      this._titleContainer = null;
      this._title = null;
      this._closeButton = null;
      this._content = null;		
    }
  };
  
  DOTA.Dialog = function(config){
    config = $.extend({
      width	: 200,
      height	: 170,
      type	: 1,
      contentPadding	: 10,
      borderStyle	: $.BorderStyle.dialog,
      zIndex	: 2000,
      isShow	: false,
      isShowMask : true,
      isInit	: false
    }, config || {});
    DOTA.Window.call(this, config);
    
    this.init();
  };
  DOTA.extend(DOTA.Dialog.prototype, DOTA.Window.prototype);
  DOTA.extend(DOTA.Dialog.prototype, {
    init : function(){
      this.initHtml();
      this.initButton();
      this.initPosition();
      this.resize();
      this.initEvent();
      
      this.animate = DOTA.Animation ? new DOTA.Animation({element: this._window, css: "d_window_movebg"}) : null;
      this.config.onLoad();
      
      if(this.config.isShow){
        this.show();
      }else{
        this._window.style.display = "none";
      }
      if(!this.config.isRegister){
        DOTA.WindowMgr.register(this, this.config.zIndex);
      }
    },
    initButton : function(){
      var v = this._window, evt = $.event;
      v.className += " d_dialog";
      
      this._onOKClick = evt.bindEvent(this, this.onOKClick);
      this._onYESClick = evt.bindEvent(this, this.onYESClick);
      this._onNOClick = evt.bindEvent(this, this.onNOClick);
      
      var b = this._buttonContainer = document.createElement("div");
      b.className = "buttonContainer";
      
      var o = this._btnOK = new DOTA.Button({text: "确定", position: "absolute", className:["d_btn", "", "d_btn_down"], onClick: this._onOKClick});
      o.renderTo(b);
      o.hide();
      
      var y = this._btnYES = new DOTA.Button({text: "确认", position: "absolute", className:["d_btn", "", "d_btn_down"], onClick: this._onYESClick});
      y.renderTo(b);
      y.hide();
      
      var n = this._btnNO = new DOTA.Button({text: "取消", position: "absolute", className:["d_btn", "", "d_btn_down"], onClick: this._onNOClick});
      n.renderTo(b);
      n.hide();
      
      this._border.appendChild(b);
    },
    resize : function(){
      var o = this.config, v = this._window, c = this._content, t = this._titleContainer, b = this._buttonContainer;
      var ok = this._btnOK, yes = this._btnYES, no = this._btnNO, style = $.dom(b).currentStyle();
      var bh = parseInt(style.height), bw = parseInt(style.width) || o.width - 2, spc = 50, top = (bh - ok.getHeight()) / 2;
      var hei = o.height - parseInt($.dom(t).currentStyle().height) - bh - o.contentPadding - 6;
      c.style.height = hei + "px";
      c.style.paddingBottom = "0px";
  
      ok.setPosition((bw - ok.getWidth()) / 2, top);
      var left = (bw - (yes.getWidth() + spc + no.getWidth())) / 2;
      yes.setPosition(left, top);
      no.setPosition(left + spc + yes.getWidth(), top);
    },
    onOKClick : function(){
      this.hide();
      this.config.onUnLoad(1);
    },
    onYESClick : function(){
      this.hide();
      this.config.onUnLoad(1);
    },
    onNOClick : function(){
      this.hide();
      this.config.onUnLoad(0);
    },
    onMouseDown : function(){
      return false;
    },
    onCloseClick : function(){
      this.onNOClick();
    },
    setPosition : function(){
      var cfg = this.config;
      if(cfg.parent){
        var wid = cfg.parent.clientWidth;
        var hei = cfg.parent.clientHeight;
        var offset = $.dom(cfg.parent).offset();
        this._window.style.left = offset.x + (wid - cfg.width) / 2 + "px";
        this._window.style.top = offset.y + (hei - cfg.height) / 2 + "px";
      }
    },
    show : function(msg){
      this.setContent(msg);
      this.setPosition();
      this.showOverLayer();
      if( this.config.type == 1 ){
        this._btnOK.show();
        this._btnYES.hide();
        this._btnNO.hide();
      }else{
        this._btnOK.hide();
        this._btnYES.show();
        this._btnNO.show();
      }
      if(this.config.animate){
        this.animate.show();
      }else{
        this._window.style.display = "block";
      }
    },
    alert : function(msg){
      this.config.type = 1;
      this.show(msg);
    },
    confirm : function(msg){
      this.config.type = 2;
      this.show(msg);
    },
    dispose : function(){
      if(!this._window) return;
      
      var evt = $.event, btn = this._closeButton, v = this._window;
      if(arguments.length == 0 && this.config.animate){
        this.animate.hide(null, evt.bindEvent(this, this.dispose, true));
        return;
      }
      this.drag.dispose();
      this.drag = null;
      
      this._btnOK.dispose();
      this._btnYES.dispose();
      this._btnNO.dispose();
      
      evt.removeEvent(btn, "mouseover", this._onCloseMouseOver);
      evt.removeEvent(btn, "mouseout", this._onCloseMouseOut);
      evt.removeEvent(btn, "click", this._onCloseClick);
      
      v.innerHTML = "";
      document.body.removeChild(v);
      if(this._overLayer){
        document.body.removeChild(this._overLayer);
        this._overLayer = null;
      }
      
      this._window = this.Window = null;
      this._titleContainer = null;
      this._title = null;
      this._closeButton = null;
      this._content = null;	
      this._buttonContainer = null;
    }
  });
  
  })();