import {expect} from "assertions"
import {display} from "../../../_util"

import {Tool} from "@bokehjs/models/tools/tool"
import {BoxZoomTool, BoxZoomToolView} from "@bokehjs/models/tools/gestures/box_zoom_tool"
import {Range1d} from "@bokehjs/models/ranges/range1d"
import {Plot, PlotView} from "@bokehjs/models/plots/plot"

describe("BoxZoomTool", () => {

  describe("Model", () => {

    it("should create proper tooltip", () => {
      const tool = new BoxZoomTool()
      expect(tool.tooltip).to.be.equal("Box Zoom")

      const x_tool = new BoxZoomTool({dimensions: "width"})
      expect(x_tool.tooltip).to.be.equal("Box Zoom (x-axis)")

      const y_tool = new BoxZoomTool({dimensions: "height"})
      expect(y_tool.tooltip).to.be.equal("Box Zoom (y-axis)")

      const tool_custom = new BoxZoomTool({description: "My box zoom tool"})
      expect(tool_custom.tooltip).to.be.equal("My box zoom tool")

      const x_tool_custom = new BoxZoomTool({dimensions: "width", description: "My box x-zoom tool"})
      expect(x_tool_custom.tooltip).to.be.equal("My box x-zoom tool")

      const y_tool_custom = new BoxZoomTool({dimensions: "height", description: "My box y-zoom tool"})
      expect(y_tool_custom.tooltip).to.be.equal("My box y-zoom tool")
    })
  })

  describe("View", () => {
    async function mkplot(tool: Tool): Promise<PlotView> {
      const plot = new Plot({
        x_range: new Range1d({start: -1, end: 1}),
        y_range: new Range1d({start: -1, end: 1}),
      })
      plot.add_tools(tool)
      const {view} = await display(plot)
      return view
    }

    it("should zoom in both ranges", async () => {
      const box_zoom = new BoxZoomTool()
      const plot_view = await mkplot(box_zoom)

      const box_zoom_view = plot_view.tool_views.get(box_zoom)! as BoxZoomToolView

      // perform the tool action
      const zoom_event0 = {type: "pan" as "pan", sx: 200, sy: 100, deltaX: 0, deltaY: 0, scale: 1, ctrlKey: false, shiftKey: false}
      box_zoom_view._pan_start(zoom_event0)

      const zoom_event1 = {type: "pan" as "pan", sx: 400, sy: 500, deltaX: 0, deltaY: 0, scale: 1, ctrlKey: false, shiftKey: false}
      box_zoom_view._pan_end(zoom_event1)

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.similar([-0.30973, 0.39823])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.similar([-0.67796, 0.67796])
    })

    it("should zoom in with match_aspect", async () => {
      const box_zoom = new BoxZoomTool({match_aspect: true})
      const plot_view = await mkplot(box_zoom)

      const box_zoom_view = plot_view.tool_views.get(box_zoom)! as BoxZoomToolView

      // perform the tool action
      const zoom_event0 = {type: "pan" as "pan", sx: 200, sy: 200, deltaX: 0, deltaY: 0, scale: 1, ctrlKey: false, shiftKey: false}
      box_zoom_view._pan_start(zoom_event0)

      const zoom_event1 = {type: "pan" as "pan", sx: 400, sy: 300, deltaX: 0, deltaY: 0, scale: 1, ctrlKey: false, shiftKey: false}
      box_zoom_view._pan_end(zoom_event1)

      const hr = plot_view.frame.x_range
      expect([hr.start, hr.end]).to.be.similar([-0.30973, 0.39823])

      const vr = plot_view.frame.y_range
      expect([vr.start, vr.end]).to.be.similar([-0.36898, 0.33898])
    })
  })
})
