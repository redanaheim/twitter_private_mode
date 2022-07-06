const bind_value = async (element_id, property_name, type, dfault) => {
    const update = async () => {
        if (type === "number") {
            await browser.storage.local.set({[property_name]: Number(document.getElementById(element_id).value)});
        }
        else await browser.storage.local.set({[property_name]: document.getElementById(element_id).value});
    }

    let input = document.getElementById(element_id);
    input.onchange = update;

    let results = await browser.storage.local.get(property_name);

    if (typeof results[property_name] !== type) {
        input.value = dfault;
        update();
    }
    else {
        input.value = results[property_name];
    }
}

const is_prime = num => {
    for (let i = 2, s = Math.sqrt(num); i <= s; i++) {
        if (num % i === 0) {
            return false;
        }
    }
    return num > 1;
}

window.addEventListener("DOMContentLoaded", async () => {
    await bind_value("name", "twitter_name", "string", "");
    await bind_value("at", "twitter_at", "string", "");
    await bind_value("seed_one", "seed_one", "number", 2985749017);
    await bind_value("seed_two", "seed_two", "number", 8411387849);
    await bind_value("names", "replacement_names", "string", "Jimmy John\nPapa Murphy")

    let btns = [document.getElementById("generate_seed_one"), document.getElementById("generate_seed_two")];
    let corresponding = ["seed_one", "seed_two"];
    btns.forEach((el, index) => {
        const property_name = corresponding[index];

        const set = async (num) => {
            await browser.storage.local.set({[property_name]: num});
            document.getElementById(property_name).value = num;
        }

        el.onclick = async () => {
            let found = 0;
            const lines = (await browser.storage.local.get("replacement_names"))["replacement_names"];
            if (typeof lines !== "string") {
                if (index === 0) await set(2985749017);
                else await set(8411387849);
            }
            const split = lines.split("\n");

            // Minimum prime size: 1000
            // Must also be greater than length of the list of possible replacement names
            let i = Math.min(Math.pow(split.length, 2), 1000) + 1;
            // We reject 99.9% of numbers randomly so that its a new seed when you click generate
            while (is_prime(i) === false || Math.random() > 0.0001) {
                i++;
            }
            await set(i);
        }
    })
});