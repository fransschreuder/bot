var coin = "YFI";
var pair = "EUR";
//couple 
var minCoins = 0.00001;
//the size of the minimum bet allowed on the exchange for a pair 
var lastSellOrder = "auto";
//the price of the last sell order 0 - not important; "auto" - for its last deal 
var lastBuyOrder = "auto";
//the price of the last order to buy 0 - not important; "auto" - for its last deal 
var steps = 3;
//greed index from 0 to infinite (10 is a very greedy bot with great chances to fly to the long immediately 1-2 shorts) 
var dwSkip = 0;
var upSkip = 2;
//how many steps to skip up or down 
var maxCoins = 0.5;
//maximum rate in% coin% 
var allowRisk = 1;
//allow negative trades (at your own risk) 0 - no; 1-yes 
var onlyOneOrder = 0;
//prohibit placing more than one order 1 - yes; 0 - no
var fee = 0.1
//exchange commission 

var range = (trader.get("LastPrice")/100)*(fee*3);
var max = trader.get("LastPrice")+(range*0.5)+0.001;
var min = trader.get("LastPrice")-(range*0.5)-0.001;
var upStep = 0;
var dwStep = 0;
var tmp = -1;
var lasttradetime = trader.get("Time");

if (lastSellOrder == "auto") lastSellOrder = trader.get("LastMySellPrice");
if (lastBuyOrder == "auto") lastBuyOrder = trader.get("LastMyBuyPrice");
if (lastSellOrder == 0) lastSellOrder = max-0.001;
if (lastBuyOrder == 0) lastBuyOrder = min+0.001;
if (minCoins > maxCoins) trader.log("CHECK SETTINGS !!!");

trader.log("now start");
trader.log("range ", range);
trader.log("max ", max.toFixed(3));
trader.log("min ", min.toFixed(3));
trader.log("lso ", lastSellOrder.toFixed(3));
trader.log("lbo ", lastBuyOrder.toFixed(3));

trader.on("LastPrice").changed()
{
    if(symbol!=coin+pair && symbol!=coin+"/"+pair)
    {
        trader.log("Wrong symbol: " + symbol + " " + coin+pair);
        return;
    }
    //If an order is not executed immediately, let's wait 1 hour and cancel all open orders.
    if(trader.get("OpenOrdersCount")>0)
    {
        if((trader.get("Time")-lasttradetime)> 3600)
        {
            trader.cancelOrders(symbol);
        }
    }
    if (trader.get("LastPrice")>max)
    {
        max = trader.get("LastPrice");
        trader.log("max changed ",max.toFixed(3));
        if (upStep<steps+upSkip)
        {
            upStep++;
            return;
        }
        if (upStep==steps+upSkip)
        {
            trader.log("time to sell ");
            upStep = 0;
            dwStep = 0;
            //min = min+trader.get("LastPrice")-max;//wtf? max = trader.get("LastPrice") => min+0?
            range = (trader.get("LastPrice")/100)*(fee*3);
            if (min>(max-range)) min=max-range;
            if (min<(max-range*2)) min=max-range*1.5;
            trader.log("min recalculated ",min.toFixed(3));
            if (onlyOneOrder && trader.get("OpenOrdersCount")){ trader.log("new order not created "); return; }
            tmp = trader.get("Balance",coin);
            if (max > lastBuyOrder+range || allowRisk)
            {   
                if (tmp < minCoins){ trader.log("can't sell less than "+minCoins); return; }
                if (tmp >= maxCoins && tmp-maxCoins >=  maxCoins ) tmp = maxCoins;
                trader.log("Selling: "+tmp+" for "+max);
                trader.sell(tmp,max);
                lasttradetime = trader.get("Time");
                sellOrder = lastSellOrder = max;
            }
            else trader.log("refusal to bid: buy for ",lastBuyOrder," won't pay off ");
        }
    }
    if (trader.get("LastPrice")<min)
    {
        min = trader.get("LastPrice");
        trader.log("min changed ",min.toFixed(3));
        if (dwStep<steps+dwSkip)
        {
            dwStep++;
            return;
        }
        if (dwStep==steps+dwSkip)
        {
            trader.log("time to buy ");
            upStep = 0;
            dwStep = 0;
            range = (trader.get("LastPrice")/100)*(fee*3);
            if (max<(min+range)) max=min+range;
            if (max>(min+range*2)) max=min+range*1.5;
            trader.log("max recalculated ",max.toFixed(3));
            if (onlyOneOrder && trader.get("OpenOrdersCount")){ trader.log("new order not created "); return; }
            tmp = trader.get("Balance",pair)/(min+0.001);
            if (min < (lastSellOrder-((lastSellOrder/100)*fee*3))||allowRisk)
            {
                if (tmp < minCoins) { trader.log("can't buy less than "+minCoins); return; }
                if (tmp > maxCoins) tmp = maxCoins;
                if (minCoins == maxCoins)
                    if (trader.get("Balance",coin) < ((tmp/100)*fee+0.001))
                        tmp=tmp+(tmp/100)*fee+0.001;
                trader.buy(tmp,min);
                lasttradetime = trader.get("Time");
                buyOrder = lastBuyOrder = min;
            }
            else trader.log("refusal to make a bad bet: sell for ",lastSellOrder," won't pay off ");
        }
    }
}

