document.addEventListener("DOMContentLoaded", function () {
  const menus = {
    "Stall A": [{name:"Chicken Rice Meal",price:85},{name:"Pork Rice Meal",price:95},{name:"French Fries",price:45}],
    "Stall B": [{name:"Iced Coffee",price:65},{name:"Milk Tea",price:75},{name:"Chocolate Cake",price:80}],
    "Stall C": [{name:"Ham Sandwich",price:60},{name:"Tuna Sandwich",price:70},{name:"Club Sandwich",price:95}]
  };
  let cart = [];
  let selectedStall = null;
  let orders = [];
  let nextOrderNumber = 1001;
  let activeOrderId = null;
  let checkoutDetails = null;
  let customerEmail = "";
  const $ = id => document.getElementById(id);
  const money = value => "₱" + value.toFixed(2);
  const cartTotal = () => cart.reduce((sum, item) => sum + item.price * item.quantity, 0);
  function showScreen(id) {
    const target = $(id);
    if (!target) { console.error("Screen not found:", id); return; }
    document.querySelectorAll(".screen").forEach(s => s.classList.remove("active"));
    target.classList.add("active");
    if (id === "ordersScreen") renderOrders();
    if (id === "vendorScreen") renderVendorOrders();
    if (id === "profileScreen") $("profileEmail").textContent = customerEmail || "Not signed in";
    window.scrollTo(0, 0);
  }
  document.querySelectorAll("[data-go]").forEach(btn => btn.addEventListener("click", () => showScreen(btn.dataset.go)));
  $("getStartedBtn").addEventListener("click", () => showScreen("loginScreen"));
  $("registerLink").addEventListener("click", e => { e.preventDefault(); showScreen("registerScreen"); });
  $("backToLoginBtn").addEventListener("click", () => showScreen("loginScreen"));
  $("registerForm").addEventListener("submit", e => { e.preventDefault(); $("registerMessage").textContent = "Registration is a UI demo; no account was created."; });
  $("loginForm").addEventListener("submit", e => { e.preventDefault(); customerEmail = $("loginEmail").value.trim(); showScreen("customerHomeScreen"); });
  $("signOutBtn").addEventListener("click", () => { customerEmail = ""; $("loginForm").reset(); showScreen("loginScreen"); });
  $("openVendorDemoBtn").addEventListener("click", () => showScreen("vendorScreen"));

  const stallCards = document.querySelectorAll(".stall-card");
  $("stallSearch").addEventListener("input", function () {
    let visible = 0;
    stallCards.forEach(card => { const match = card.textContent.toLowerCase().includes(this.value.trim().toLowerCase()); card.style.display = match ? "flex" : "none"; if (match) visible++; });
    $("stallMessage").textContent = visible ? "" : "No stalls found.";
  });
  stallCards.forEach(card => card.addEventListener("click", () => openStall(card.dataset.stall)));
  function openStall(stall) {
    if (cart.length && selectedStall && selectedStall !== stall) {
      if (!window.confirm("Your cart contains items from " + selectedStall + ". Clear the cart and switch to " + stall + "?")) return;
      cart = [];
    }
    selectedStall = stall;
    $("selectedStallName").textContent = stall;
    $("menuMessage").textContent = "";
    const container = $("menuItems"); container.replaceChildren();
    menus[stall].forEach(item => {
      const row = document.createElement("div"); row.className = "menu-item";
      const info = document.createElement("div"); info.className = "menu-item-info";
      const name = document.createElement("strong"); name.textContent = item.name;
      const price = document.createElement("small"); price.textContent = money(item.price);
      info.append(name, price);
      const add = document.createElement("button"); add.className = "add-btn"; add.textContent = "ADD";
      add.addEventListener("click", () => {
        const existing = cart.find(x => x.name === item.name);
        if (existing) existing.quantity++;
        else cart.push({stall, name:item.name, price:item.price, quantity:1});
        $("menuMessage").textContent = item.name + " added to cart!";
      });
      row.append(info, add); container.append(row);
    });
    showScreen("stallMenuScreen");
  }
  $("menuCartBtn").addEventListener("click", () => { renderCart(); showScreen("cartScreen"); });
  $("cartMenuBtn").addEventListener("click", () => showScreen(selectedStall ? "stallMenuScreen" : "customerHomeScreen"));
  $("backToMenuBtn").addEventListener("click", () => showScreen(selectedStall ? "stallMenuScreen" : "customerHomeScreen"));
  function renderCart() {
    const container = $("cartItems"); container.replaceChildren();
    cart.forEach((item, index) => {
      const row = document.createElement("div"); row.className = "cart-item";
      const info = document.createElement("div"); info.className = "cart-item-info";
      const name = document.createElement("strong"); name.textContent = item.name;
      const price = document.createElement("small"); price.textContent = money(item.price) + " × " + item.quantity;
      info.append(name, price);
      const controls = document.createElement("div"); controls.className = "cart-controls";
      const minus = document.createElement("button"); minus.className = "quantity-btn"; minus.textContent = "−"; minus.setAttribute("aria-label", "Decrease " + item.name);
      minus.addEventListener("click", () => { if (item.quantity > 1) item.quantity--; else cart.splice(index, 1); renderCart(); });
      const quantity = document.createElement("span"); quantity.textContent = item.quantity;
      const plus = document.createElement("button"); plus.className = "quantity-btn"; plus.textContent = "+"; plus.setAttribute("aria-label", "Increase " + item.name);
      plus.addEventListener("click", () => { item.quantity++; renderCart(); });
      const remove = document.createElement("button"); remove.className = "remove-btn"; remove.textContent = "Remove";
      remove.addEventListener("click", () => { cart.splice(index, 1); renderCart(); });
      controls.append(minus, quantity, plus, remove); row.append(info, controls); container.append(row);
    });
    $("cartTotal").textContent = money(cartTotal());
    $("emptyCartMessage").hidden = cart.length !== 0;
    $("checkoutBtn").disabled = cart.length === 0;
  }
  $("checkoutBtn").addEventListener("click", () => { if (!cart.length) return; renderCheckout(); showScreen("checkoutScreen"); });
  $("backToCartBtn").addEventListener("click", () => { renderCart(); showScreen("cartScreen"); });
  function renderCheckout() {
    $("checkoutStall").textContent = "Ordering from: " + selectedStall;
    const container = $("checkoutItems"); container.replaceChildren();
    cart.forEach(item => {
      const row = document.createElement("div"); row.className = "checkout-item";
      const description = document.createElement("span"); description.textContent = item.name + " × " + item.quantity;
      const amount = document.createElement("strong"); amount.textContent = money(item.price * item.quantity);
      row.append(description, amount); container.append(row);
    });
    $("checkoutTotal").textContent = money(cartTotal());
  }
  $("checkoutForm").addEventListener("submit", e => {
    e.preventDefault(); if (!cart.length || !selectedStall) return;
    checkoutDetails = {name:$("pickupName").value.trim(), pickupTime:$("pickupTime").value};
    $("paymentStall").textContent = "Pay to: " + selectedStall;
    $("paymentTotal").textContent = money(cartTotal());
    $("paymentMessage").textContent = "";
    showScreen("paymentScreen");
  });
  $("demoFailedBtn").addEventListener("click", () => { $("paymentMessage").textContent = "Demo payment failed. Order not confirmed or sent to vendor."; });
  $("demoPaidBtn").addEventListener("click", () => {
    if (!cart.length || !selectedStall || !checkoutDetails) return;
    const order = {id:"SEC-" + String(nextOrderNumber++),stall:selectedStall,items:cart.map(item => ({...item})),total:cartTotal(),name:checkoutDetails.name,pickupTime:checkoutDetails.pickupTime,status:"Confirmed",payment:"Simulated verified",createdAt:new Date().toLocaleString()};
    orders.push(order); activeOrderId = order.id; cart = []; checkoutDetails = null;
    $("checkoutForm").reset();
    renderConfirmation(order); showScreen("confirmationScreen");
  });
  function addDetailLine(container, label, value) {
    const p = document.createElement("p");
    const strong = document.createElement("strong"); strong.textContent = label + ": ";
    p.append(strong, document.createTextNode(String(value))); container.append(p);
  }
  function renderConfirmation(order) {
    const box = $("confirmationDetails"); box.replaceChildren();
    addDetailLine(box,"Order Number",order.id); addDetailLine(box,"Stall",order.stall);
    addDetailLine(box,"Customer",order.name); addDetailLine(box,"Pickup Time",order.pickupTime);
    addDetailLine(box,"Total",money(order.total)); addDetailLine(box,"Status",order.status);
    addDetailLine(box,"Payment","SIMULATED — not a real transaction");
  }
  function renderOrders() {
    const container = $("ordersList"); container.replaceChildren();
    if (!orders.length) { const p = document.createElement("p"); p.className="note"; p.textContent="No confirmed demo orders yet."; container.append(p); return; }
    [...orders].reverse().forEach(order => {
      const button = document.createElement("button"); button.className = "order-card";
      const title = document.createElement("strong"); title.textContent = order.id + " — " + order.stall;
      const status = document.createElement("span"); status.className="status"; status.textContent = "Status: " + order.status;
      const amount = document.createElement("small"); amount.textContent = money(order.total) + " • " + order.createdAt;
      button.append(title,status,amount); button.addEventListener("click", () => { activeOrderId = order.id; renderOrderDetail(order); showScreen("orderDetailScreen"); }); container.append(button);
    });
  }
  function renderOrderDetail(order) {
    const box = $("orderDetailContent"); box.replaceChildren();
    addDetailLine(box,"Order Number",order.id); addDetailLine(box,"Stall",order.stall);
    addDetailLine(box,"Status",order.status); addDetailLine(box,"Customer",order.name);
    addDetailLine(box,"Pickup Time",order.pickupTime);
    order.items.forEach(item => addDetailLine(box,item.name,item.quantity + " × " + money(item.price)));
    addDetailLine(box,"Total",money(order.total)); addDetailLine(box,"Payment","SIMULATED verification");
  }
  $("vendorStall").addEventListener("change", renderVendorOrders);
  function renderVendorOrders() {
    const stall = $("vendorStall").value; const container = $("vendorOrders"); container.replaceChildren();
    const matches = orders.filter(order => order.stall === stall);
    if (!matches.length) { const p = document.createElement("p"); p.className="note"; p.textContent="No demo orders for " + stall + "."; container.append(p); return; }
    matches.forEach(order => {
      const card = document.createElement("div"); card.className = "detail-panel";
      addDetailLine(card,"Order",order.id); addDetailLine(card,"Customer",order.name);
      addDetailLine(card,"Pickup",order.pickupTime); addDetailLine(card,"Status",order.status);
      order.items.forEach(item => addDetailLine(card,item.name,item.quantity + " × " + money(item.price)));
      addDetailLine(card,"Total",money(order.total));
      const next = {"Confirmed":"Preparing","Preparing":"Ready for Pickup","Ready for Pickup":"Completed"}[order.status];
      if (next) {
        const actions = document.createElement("div"); actions.className="vendor-actions";
        const button = document.createElement("button"); button.textContent = "MARK " + next.toUpperCase();
        button.addEventListener("click", () => { order.status = next; renderVendorOrders(); });
        actions.append(button); card.append(actions);
      }
      container.append(card);
    });
  }
});
