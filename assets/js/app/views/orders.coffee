class App.OrdersView extends App.MasterView

  tpl: null

  collection: null

  events:
    "click .cancel": "onCancelClick"

  initialize: (options = {})->
    @tpl = options.tpl  if options.tpl
    @$totalsEl = options.$totalsEl  if options.$totalsEl
    $.subscribe "new-order", @onNewOrder
    $.subscribe "order-completed", @onOrderCompleted
    $.subscribe "order-canceled", @onOrderCanceled

  render: ()->
    @collection.fetch
      success: ()=>
        @collection.each (order)=>
          @$el.append @template
            order: order
        @renderVolume()  if @$totalsEl

  renderVolume: ()->
    @$totalsEl.text @collection.calculateVolume()

  onNewOrder: (ev, order)=>
    @$el.empty()
    @render()

  onOrderCompleted: (ev, order)=>
    $existentOrder = @$("[data-id='#{order.id}']")
    if $existentOrder.length
      $existentOrder.addClass "highlight"
      setTimeout ()->
          $existentOrder.remove()  if $existentOrder.length
        , 1000

  onOrderCanceled: (ev, data)=>
    @$el.empty()
    @render()

  onCancelClick: (ev)->
    ev.preventDefault()
    if confirm "Are you sure?"
      order = new App.OrderModel
        id: $(ev.target).data("id")
      order.destroy
        success: ()=>
          #@$el.find("tr[data-id='#{order.id}']").remove()
        error: (m, xhr)->
          $.publish "error", xhr