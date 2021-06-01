const views = (function () {
    const elem = {
        income: document.querySelector(".income__element"),
        expense: document.querySelector(".expense__element"),

        incomeTotal: document.querySelector(".income__label"),
        expenseTotal: document.querySelector(".expense__label"),
        totalBudget: document.querySelector(".balance"),

        date: document.querySelector(".get__date"),
        formInput: document.querySelector(".form__input"),

        add: [document.querySelector(".add__btn"), document],
        inputBtn: document.querySelector(".add__btn"),
        inputType: document.querySelector(".add__type"),
        inputDes: document.querySelector(".add__description"),
        inputValue: document.querySelector(".add__value"),

        outputArea: document.querySelector(".output__area"),

        reletive: document.querySelector(".relative"),
        reletiveIncome: document.querySelector(".relative__income"),
        reletiveExpense: document.querySelector(".reletive__expense"),

        alert: document.querySelector(".alert"),
    };

    return {
        createHTML(data) {
            const name = ["income", "expense"];
            name.forEach((i) => {
                let el = ``;
                if (data[i].size > 0 || data[i].length > 0) {
                    for (const [id, obj] of data[i].entries()) {
                        const [, , date] = obj.date.split("-");
                        let strDate = [...date].map((n) => Number(n));
                        if (strDate[strDate.length - 1] === 2) {
                            strDate = Number(date) + "nd";
                        } else if (strDate[strDate.length - 1] === 3) {
                            strDate = Number(date) + "td";
                        } else if (strDate[strDate.length - 1] === 1) {
                            strDate = Number(date) + "st";
                        } else {
                            strDate = Number(date) + "th";
                        }
                        const valueType =
                            obj.type === "expense"
                                ? "- " + obj.value.toLocaleString()
                                : "+ " + obj.value.toLocaleString();

                        el += `
                        <div class="${obj.type}" data-id="${id}" data-date="${Number(date)}">
                            <div class="date">${strDate}</div>
                            <div class="description">${obj.description}</div>
                            <div class="value">${valueType}</div>
                            <span class="del__btn far fa-trash-alt"></span>
                        </div>
                        `;
                    }
                    elem[i].insertAdjacentHTML("beforeend", el);
                    console.log("views, Create HTML...");
                }
            });
        },
        clearHTML() {
            elem.income.innerHTML = "";
            elem.expense.innerHTML = "";
            console.log("views, Clear HTML...");
        },
        updateTotal(data) {
            const balance =
                data.balance % 1 === 0 ? data.balance.toLocaleString() + ".00" : data.balance.toLocaleString();
            elem.incomeTotal.textContent = data.incomeTotal.toLocaleString();
            elem.expenseTotal.textContent = "-" + data.expenseTotal.toLocaleString();
            elem.totalBudget.textContent = balance;
            console.log("views, UPDATE TOTAL UI...");
        },
        elem: elem,
    };
})();
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
const models = (function () {
    class Budget {
        constructor(type, description, value, date) {
            this.type = type;
            this.description = description;
            this.value = value;
            this.date = date;
        }
    }

    let data = new Map();
    console.log("MODELS, DATA HAS UPDATE...");

    async function postApi(curData, year) {
        // POST API
        console.log("MODELS ,POSTING API...");
        console.log(curData);
        try {
            const mapData = curData.get(year);
            const n = [];
            for (const [key, value] of mapData) {
                n.push({
                    id: key,
                    income: [...value.income.values()],
                    expense: [...value.expense.values()],
                    incomeTotal: value.incomeTotal,
                    expenseTotal: value.expenseTotal,
                    balance: value.balance,
                });
            }
            await fetch(`http://localhost:3004/years`, {
                method: "post",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    id: year,
                    months: [...n],
                }),
            });
        } catch (err) {
            console.log("Error 404 API NOT FOUND", err);
        }
    }

    function pushFakeData(year) {
        console.log("MODELS, PUSHING FAKE DATA...");
        let monthsData = new Map();
        for (i = 1; i <= 12; i++) {
            let newData = {
                income: new Map(),
                expense: new Map(),
                incomeTotal: 0,
                expenseTotal: 0,
                balance: 0,
            };
            monthsData.set(i, newData);
        }
        data.set(year, monthsData);
        postApi(data, year);
    }

    async function pushToData(api, year) {
        // 1 push data
        let monthsData = new Map();
        await api.forEach((m) => {
            let newData = {
                income: new Map(),
                expense: new Map(),
                incomeTotal: m.incomeTotal,
                expenseTotal: m.expenseTotal,
                balance: m.balance,
            };
            if (m.income.size > 0 || m.income.length > 0) {
                m.income.forEach((inc) => {
                    newData.income.set(calcID(newData), inc);
                });
            }
            if (m.expense.size > 0 || m.expense.length > 0) {
                m.expense.forEach((exp) => {
                    newData.expense.set(calcID(newData), exp);
                });
            }
            monthsData.set(Number(m.id), newData);
        });
        data.set(year, monthsData);
        console.log(`MODELS, PUSHING API TO DATA...`);
    }

    function calcID(curData) {
        let randomID = Math.floor(Math.random() * 10000);
        while (curData.income.has(randomID) || curData.expense.has(randomID)) {
            randomID = Math.floor(Math.random() * 10000);
        }
        return randomID;
    }

    return {
        addItem(type, des, value, date) {
            // date = array [year, month, day]
            console.log("ADD NEW ITEM");
            const budg = new Budget(type, des, value, date.join("-"));
            const curData = data.get(date[0]).get(date[1]);
            curData[type].set(calcID(curData), budg);

            return budg;
        },
        async fetchFn(year) {
            // GET API
            console.log("MODELS ,FETCHING API...");
            try {
                return await fetch(`http://localhost:3004/years/${year}`)
                    .then((rows) => {
                        if (rows.status === 404) throw rows.status;
                        return rows.json();
                    })
                    .then((res) => {
                        pushToData(res.months, year);
                    })
                    .catch((reject) => {
                        // if api have no data of the year this function gonna create fake data store in memory
                        if (reject === 404) {
                            pushFakeData(year);
                        }
                        throw reject;
                    });
            } catch (err) {
                console.log("Error 404 API NOT FOUND", err);
                if (err.toString() === "TypeError: Failed to fetch") return data = "no server";
            } finally {
                return data;
            }
        },
        async putApi(curData, year) {
            console.log("MODELS ,PUTING API...");
            try {
                const mapData = curData.get(year);
                const n = [];
                for (const [key, value] of mapData) {
                    n.push({
                        id: key,
                        income: [...value.income.values()],
                        expense: [...value.expense.values()],
                        incomeTotal: value.incomeTotal,
                        expenseTotal: value.expenseTotal,
                        balance: value.balance,
                    });
                }
                await fetch(`http://localhost:3004/years/${year}`, {
                    method: "put",
                    headers: {
                        "Content-Type": "application/json",
                    },
                    body: JSON.stringify({
                        id: year,
                        months: [...n],
                    }),
                });
            } catch (err) {
                console.log("Error 404 API NOT FOUND", err);
                return false;
            }
        },
        calcTotal(data, type) {
            if (!data) return;
            // calc total income and expense
            let sum = 0;
            if (data[type].size > 0) {
                for (const obj of data[type].values()) {
                    sum += obj.value;
                }
            }
            data[`${type}Total`] = sum;

            // calc total budget
            data.balance = data.incomeTotal - data.expenseTotal;

            console.log(`MODELS, CALCULATING ${type} TOTAL...`);
        },
        data,
    };
})();
///////////////////////////////////////////////////////////////////////////////////////////////////
///////////////////////////////////////////////////////////////////////////////////////////////////
const controller = (function (model, UI) {
    function setupUI(data) {
        UI.elem.inputDes.value = "";
        UI.elem.inputValue.value = "";
        UI.elem.inputDes.focus();
        UI.clearHTML();

        if (!data) return;
        UI.createHTML(data);
        UI.updateTotal(data);
    }

    // Add Item PUT API

    const addNewList = () => {
        const getType = UI.elem.inputType.value;
        const getDes = UI.elem.inputDes.value;
        const getValue = parseFloat(parseFloat(UI.elem.inputValue.value).toFixed(2));
        const getDate = UI.elem.date.value;

        if (getType && getDes && getValue >= 0 && getValue <= 10000000 && getDate) {
            // [year, month, day]
            const date = getDate.split("-").map((n) => Number(n));
            model.addItem(getType, getDes, getValue, date);
            console.log(model.data);

            const curData = model.data.get(date[0]).get(date[1]);
            model.calcTotal(curData, getType);

            setupUI(curData);

            // model.putApi(curData, date[0], date[1]);
            model.putApi(model.data, date[0]);
        }
    };

    UI.elem.inputBtn.addEventListener("click", (e) => {
        addNewList();
    });

    document.addEventListener("keypress", (e) => {
        if (e.key === "Enter") {
            addNewList();
        }
    });

    // Change month or year FETCH API
    let prevMonth = 0;
    let prevYear = 0;
    UI.elem.date.addEventListener("change", async (e) => {
        e.preventDefault();
        const [year, month] = UI.elem.date.value.split("-").map((n) => Number(n));

        if (month !== prevMonth || year !== prevYear) {
            if (year !== prevYear) model.data = await model.fetchFn(year);
            prevMonth = month;
            prevYear = year;

            // get Data Current Month input
            console.log(model.data);
            const curData = model.data.get(year).get(month);
            console.log("DATA ON MONTH..." + month, curData);
            model.calcTotal(curData, "income");
            model.calcTotal(curData, "expense");

            setupUI(curData);
        }
    });

    // Delete API
    UI.elem.outputArea.addEventListener("click", (e) => {
        if (e.target.matches(".del__btn")) {
            const [year] = UI.elem.date.value.split("-").map((n) => Number(n));

            // delete from UI
            let getType = e.target.parentElement.className;
            let id = parseInt(e.target.parentNode.dataset.id);

            // Delete from data
            curData[getType].delete(id);

            // Update DATA total
            model.calcTotal(curData, getType);

            // Delete from api
            model.putApi(model.data, year);

            setupUI(curData);
        }
    });

    const dateToStr = (...date) => {
        const strDate = date.map((d) => {
            if (d < 10) return "0" + d;
            return d;
        });
        return strDate.join("-").toString();
    };

    return {
        async init() {
            const [curYear, curMonth, curDay] = [
                new Date().getFullYear(),
                new Date().getMonth() + 1,
                new Date().getDate(),
            ];
            // SET CURRENT DATE TO DATE INPUT
            UI.elem.date.value = dateToStr(curYear, curMonth, curDay);

            // FETCH API DATA
            // PUT API DATA TO MAP DATA
            // UPDATE TOTAL DATA
            const wholeData = await model.fetchFn(curYear);

            // Check json-server
            if (wholeData === 'no server') UI.elem.alert.style.display = 'block'
            const curData = wholeData.get(curYear).get(curMonth);

            model.calcTotal(curData, "income");
            model.calcTotal(curData, "expense");

            setupUI(curData);

            console.log("CONTROLLER, init FUNCTION HAS UPDATE...");
        },
    };
})(models, views);
controller.init();
