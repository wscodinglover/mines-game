(function(){
  var $ = DOTA;
  
  DOTA.Drag = function(dragElement, config){
    this.drag = $.$(dragElement);
    this._x = this._y = 0;
    this._martinLeft = this._marginTop = 0;
    this.config = $.extend({
      handle:			null,//设置触发对象（不设置则使用拖放对象）
      limit:			false,//是否设置范围限制(为true时下面参数有用,可以是负数)
      mxLeft:			0,//左边限制
      mxRight:		9999,//右边限制
      mxTop:			0,//上边限制
      mxBottom:		9999,//下边限制
      mxContainer:	"",//指定限制在容器内
      lockX:			false,//是否锁定水平方向拖放
      lockY:			false,//是否锁定垂直方向拖放
      lock:			false,//是否锁定
      transparent:	true,//拖动时是否半透明
      cancelBubble:	true, //取消冒泡
      onStart:		function(){},//开始移动时执行
      onMove:			function(){},//移动时执行
      onStop:			function(){}//结束移动时执行
    }, config || {});
    this.config.handle = this.config.handle || this.drag;
    this.config.mxContainer = $.$(this.config.mxContainer) || null;
    
    this.drag.style.position = "absolute";
    //如果有容器必须设置position为relative或absolute来相对或绝对定位，并在获取offset之前设置
    !this.config.mxContainer || $.dom(this.config.mxContainer).currentStyle().position == "relative" || $.dom(this.config.mxContainer).currentStyle().position == "absolute" || (this.config.mxContainer.style.position = "relative");
    
    this._startHandler = $.event.bindEvent(this, this.start);
    this._moveHandler = $.event.bindEvent(this, this.move);
    this._stopHandler = $.event.bindEvent(this, this.stop);
    this._clickHandler = $.event.bindEvent(this, this.onClick);
    
    $.event.addEvent(this.config.handle, "mousedown", this._startHandler);
    $.event.addEvent(this.config.handle, "click", this._clickHandler);
  };
  
  DOTA.Drag.prototype = {
    setOpacity : function(opacity){
      $.dom(this.drag).setOpacity(opacity);
    },
    onClick : function(oEvent){
      if(this.config.cancelBubble){
        oEvent.stopPropagation();
      }
    },
    start : function(oEvent){
      var cfg = this.config;
      if(cfg.lock){
        return;
      }
      var evt = $.event.getEvent();
      this._x = evt.pageX;
      this._y = evt.pageY;	
      
      //半透明
      if(cfg.transparent){
        this.oldOpacity = $.dom(this.drag).getOpacity();
        this.setOpacity(50);
      }
      
      $.event.addEvent(document, "mousemove", this._moveHandler);
      $.event.addEvent(document, "mouseup", this._stopHandler);
      
      if(cfg.cancelBubble){
        oEvent.stopPropagation();
      }
      cfg.onStart(evt);
    },
    
    move : function(){
      var cfg = this.config,
        evt = $.event.getEvent();
      var x = evt.pageX - this._x, y = evt.pageY - this._y, o, c;
      var s = $.dom(this.drag).currentStyle();
      var left = parseInt(s.left, 10), top = parseInt(s.top, 10);
      var offset = $.dom(this.drag).offset();
      
      left = isNaN(left) ? offset.left : left;
      top = isNaN(top) ? offset.top : top;
      x += left, y += top;
      
      //清除选择
      window.getSelection ? window.getSelection().removeAllRanges() : document.selection.empty();
  
      //限制范围
      if(cfg.limit || cfg.mxContainer){
        o = $.extend({}, cfg);
        if(cfg.mxContainer){
          if(!this.limit){
            o.mxLeft = 0, o.mxTop = 0, o.mxBottom = 9999, o.mxRight = 9999;
          }
          c = $.dom(cfg.mxContainer).currentStyle();
          
          o.mxLeft = Math.max(o.mxLeft, (isNaN(parseInt(c.left, 10)) ? 0 : parseInt(c.left, 10)));
          o.mxTop = Math.max(o.mxTop, (isNaN(parseInt(c.top, 10)) ? 0 : parseInt(c.top, 10)));
          o.mxRight = Math.min(o.mxRight, cfg.mxContainer.offsetWidth);
          o.mxBottom = Math.min(o.mxBottom, cfg.mxContainer.offsetHeight);
        }
        x = Math.min(Math.max(x, o.mxLeft), o.mxRight - this.drag.offsetWidth);
        y = Math.min(Math.max(y, o.mxTop ), o.mxBottom - this.drag.offsetHeight);
      }
      cfg.lockX || (this.drag.style.left = x + "px");
      cfg.lockY || (this.drag.style.top  = y + "px");
      
      this._x = evt.pageX, this._y = evt.pageY;
      
      cfg.onMove(evt);
    },
    
    stop : function(){
      var cfg = this.config;
      //取消半透明
      if(cfg.transparent){
        this.setOpacity(this.oldOpacity);
      }
      
      $.event.removeEvent(document, "mousemove", this._moveHandler);
      $.event.removeEvent(document, "mouseup", this._stopHandler);
      
      //回调事件
      cfg.onStop();
    },
    
    dispose : function(){
      $.event.removeEvent(this.config.handle, "mousedown", this._startHandler);
      $.event.removeEvent(this.config.handle, "click", this._clickHandler);
      
      this.drag = this.config.handle = null;
      this._moveHandler = null;
      this._stopHandler = null;
      this._startHandler = null;
      this._clickHandler = null;
    }
  };
  
  })();