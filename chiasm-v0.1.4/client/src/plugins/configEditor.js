// A JSON configuration editor plugin.
//
// This uses CodeMirror to provide a live editing environment for the runtime configuration.
// This allows users to edit the configuration JSON interactively and see it change while the system is running.
//
// Created by Curran Kelleher Feb 2015
define(["d3", "model", "lodash", "codemirror/lib/codemirror", "codemirror/mode/javascript/javascript", "inlet"], function (d3, Model, _, CodeMirror) {

  return function ConfigEditor(runtime) {

    var model = Model({
      // The `hidden` boolean property triggers the layout
      // to recalculate to show and hide the editor.
      publicProperties: [ "hidden" , "size"],
      size: "400px"
    });

    // Append a div to contain the editor to the runtime div.
    // Use CSS `position: absolute;` so setting `left` and `top` CSS
    // properties later will position the SVG relative to the runtime div.
    var div = d3.select(runtime.div)
      .append("div")
      .style("position", "absolute");

    // Append an instance of CodeMirror to the div.
    var editor = CodeMirror(div.node(), {

      // This ensures that all the text is displayed after resizing.
      // See http://codemirror.net/demo/resize.html
      viewportMargin: Infinity,

      // This makes the editor display syntax-highlighted JSON.
      mode:  "javascript"
    });

    // Keeps track of the config string from the CodeMirror editor
    // that was the last to be parsed and set as the runtime config.
    var oldConfigStr;

    // Edit the text when the runtime config updates.
    runtime.when("config", function(config){
      var newConfigStr = JSON.stringify(config, null, 2);
      if(newConfigStr !== oldConfigStr){
        editor.setValue(newConfigStr);
      } 
    });

    // Update the runtime config when text is edited.
    editor.on("change", _.throttle(function(){
      oldConfigStr = editor.getValue();
      runtime.config = JSON.parse(oldConfigStr);

      // Throttle by 33 ms so the frequent updates induced by Inlet widgets
      // propagates through the system at most 30 frames per second (1000 / 30 = 33.333).
    }, 33));

    // When the size of the visualization is set by the layout plugin,
    model.when("box", function (box) {


      // set the CSS (left, top, width, height) properties to move and
      // position the editor relative to the runtime div.
      div
        .style("left", box.x + "px")
        .style("top", box.y + "px")
        .style("width", box.width + "px")
        .style("height", box.height + "px");

      // Update the height of the CodeMirror editor.
      div.select(".CodeMirror")
        .style("height", box.height + "px");
    });

    // Clean up the DOM elements when the component is destroyed.
    model.destroy = function(){

      // TODO test this
      // TODO remove config listener
      runtime.div.removeChild(textarea.node());
    };

    // Augment the editor using Inlet, which gives
    // the user a color picker for colors and a slider for numbers.
    Inlet(editor);

    return model;
  };
});
