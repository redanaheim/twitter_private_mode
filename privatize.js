/*
    Script overview

    - Sets up a MutationObserver at injection time (DOM load) to catch element insertion after page load
    - Removes username and @ from text nodes
*/

/**
 * @param {string} str exact text to match in regex
 * @returns string for use in RegExp constructer
 */
const escape_reg_exp = (str) => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"); // $& means the whole matched string
};

/**
 * @param {number} num
 * @returns whether num is prime
 */
const is_prime = num => {
    for (let i = 2, s = Math.sqrt(num); i <= s; i++) {
        if (num % i === 0) {
            return false;
        }
    }
    return num > 1;
}

/**
 * @param {number} num
 * @returns xth prime where x is num
 */
const xth_prime = (num) => {
    let count = 1;
    let i = 2;
    while (count < num) {
        i++;
        if (is_prime(i)) {
            count++;
        }
    }
    return i;
}

/**
 * @param {string} key
 */
const storage_get = async (key) => {
    return (await browser.storage.local.get(key))[key];
}

(async () => {
    const REAL_NAME = await storage_get("twitter_name");
    const REAL_AT = await storage_get("twitter_at");

    if (REAL_NAME === undefined || REAL_AT === undefined) {
        console.log("Error: Real name and at are unknown so no replacing can be done")
        return;
    }
    
    const TARGET_NAME = new RegExp(escape_reg_exp(REAL_NAME), "ig");
    const TARGET_AT = new RegExp(escape_reg_exp(REAL_AT), "ig");
    
    const POSSIBLE_NAMES = (await storage_get("replacement_names")).split("\n");
    
    const LOG = true;
    
    const log = (...args) => {
        if (LOG) console.log(...args);
    }
    
    const RANDOM_ID = Math.round(Math.random() * 65536);
    
    const FACTOR_NAME = Math.pow(await storage_get("seed_one"), 1);
    const FACTOR_AT = Math.pow(await storage_get("seed_two"), 1);
    const SECONDS_IN_DAY = 24 * 60 * 60;
    const SECONDS_TIMESTAMP = Math.floor(new Date().getTime() / 1000);
    const DAY = Math.floor(SECONDS_TIMESTAMP / SECONDS_IN_DAY);
    const DAY_FACTOR = xth_prime(DAY);
    const RANDOM_NAME = POSSIBLE_NAMES[(DAY_FACTOR * FACTOR_NAME) % POSSIBLE_NAMES.length];
    const RANDOM_AT = POSSIBLE_NAMES[(DAY_FACTOR * FACTOR_AT) % POSSIBLE_NAMES.length].toLowerCase().replaceAll(/\s+/g, "_");

    /**
     * @param {string} str
     */
    const fix_text = str => {
        return str
            .replaceAll(TARGET_NAME, RANDOM_NAME)
            .replaceAll(TARGET_AT, RANDOM_AT)
    }
    
    /**
     * @param {Node} el
     * @param {(arg0: Node) => void} closure
     */
    const for_text_in_children = (el, closure) => {
        if (el.nodeType === Node.TEXT_NODE) {
            const parent = el.parentNode;
            if (parent.nodeType === Node.ELEMENT_NODE && (parent.tagName === "SCRIPT" || parent.tagName === "STYLE" || parent.tagName === "NOSCRIPT")) {
                return;
            }
            else if (el.textContent.trim().length === 0) {
                return;
            }
            else {
                log(el);
                closure(el);
            }
        }
        el.childNodes.forEach(x => for_text_in_children(x, closure));
    }
    
    let stopped = true;
    
    /**
     * @param {MutationObserver} obs
     */
    const stop = (obs) => {
        if (!stopped) {
            stopped = true;
            obs.disconnect();
        }
    }
    
    
    /**
     * @param {MutationObserver} obs
     */
    
    const start = (obs) => {
        if (stopped) {
            stopped = false;
            obs.observe(document, { subtree: true, childList: true, characterData: true });
        }
    }
    
    /**
     * @param {Node} el
     * @param {MutationObserver} obs
     */
    const obs_check = (el, obs) => {
        for_text_in_children(el, text_el => {
            stop(obs);
            text_el.textContent = fix_text(text_el.textContent);
        });
    }
    
    let observer = new MutationObserver(mutations => {
        log(mutations);
        mutations.forEach(mutation => {
            if (mutation.type === "childList" || mutation.type === "characterData") {
                obs_check(mutation.target, observer);
                if (mutation.type === "childList") {
                    mutation.addedNodes.forEach(x => obs_check(x, observer));
                }
            }
        });
        start(observer);
    });
    
    start(observer);
})();