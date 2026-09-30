(function () {
  "use strict";

  function get(id) { return document.getElementById(id); }
  function count(id) {
    var value = Number(get(id).value);
    if (!Number.isFinite(value) || value < 0) return 0;
    return Math.floor(value);
  }
  function money(value) {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: "USD",
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
  function memberGrowth(members) {
    var total = 0;
    if (members > 50) total += (Math.min(members, 100) - 50) * 1;
    if (members > 100) total += (Math.min(members, 200) - 100) * 0.5;
    if (members > 200) total += (members - 200) * 0.25;
    return total;
  }
  function calculate() {
    var members = count("members");
    var growth = memberGrowth(members);
    var coach = count("coaches") * 5;
    var admin = count("admins") * 20;
    var fencer = count("fencers") * 15;
    var locations = count("locations") * 19;
    var addons = 0;
    document.querySelectorAll(".addon").forEach(function (input) {
      if (input.checked) addons += Number(input.getAttribute("data-price")) || 0;
    });
    var total = 49 + growth + coach + admin + fencer + locations + addons;
    get("growthCost").textContent = money(growth);
    get("coachCost").textContent = money(coach);
    get("adminCost").textContent = money(admin);
    get("fencerCost").textContent = money(fencer);
    get("locationCost").textContent = money(locations);
    get("addonCost").textContent = money(addons);
    get("grandTotal").textContent = money(total);
    var detail = get("growthDetail");
    if (detail) {
      detail.textContent = members + " active members · first 50 included in Core";
    }
  }
  document.querySelectorAll("input").forEach(function (input) {
    input.addEventListener("input", calculate);
    input.addEventListener("change", calculate);
  });
  calculate();
})();
