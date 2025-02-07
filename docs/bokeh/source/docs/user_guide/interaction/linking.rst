.. _userguide_interaction_linked:

Linking behavior
----------------

It's often useful to link plots to add connected interactivity between plots.
This section shows an easy way to do this, using the |bokeh.plotting| interface.

.. _userguide_interaction_linked_panning:

Linked panning
~~~~~~~~~~~~~~

It's often desired to link pan or zooming actions across many plots. All that is
needed to enable this feature is to share range objects between |figure|
calls.

.. bokeh-plot:: docs/user_guide/examples/interaction_linked_panning.py
    :source-position: above

Now you have learned how to link panning between multiple plots with the
|bokeh.plotting| interface.

.. _userguide_interaction_linked_brushing:

Linked brushing
~~~~~~~~~~~~~~~

Linked brushing in Bokeh is expressed by sharing data sources between glyph
renderers. This is all Bokeh needs to understand that selections acted on one
glyph must pass to all other glyphs that share that same source. To see how linked
selection extends to glyph renderers that plot only a subset of data from a data
source, see :ref:`userguide_data_linked_selection_with_filtering`.

The following code shows an example of linked brushing between circle glyphs on
two different |figure| calls.

.. bokeh-plot:: docs/user_guide/examples/interaction_linked_brushing.py
    :source-position: above

.. _userguide_interaction_linked_properties:

Linked properties
~~~~~~~~~~~~~~~~~

It is also possible to link values of Bokeh model properties together so that
they remain synchronized, using the :func:`~bokeh.model.Model.js_link` method.
The example below links a circle glyph radius to the value of a Slider widget:

.. bokeh-plot:: docs/user_guide/examples/interaction_linked_properties.py
    :source-position: above

The linking is accomplished in JavaScript, so this method works in standalone
Bokeh documents, or in Bokeh server applications.

See :ref:`userguide_interaction_widgets` for more information about different
widgets, and :ref:`userguide_interaction_jscallbacks` for more information about
creating arbitrary JavaScript callbacks.
