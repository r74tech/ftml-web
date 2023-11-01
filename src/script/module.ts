export default function wikidotmodule() {
    const containers = document.querySelectorAll(".foldable-list-container");
    containers.forEach((container) => {
        container.addEventListener("click", foldableMenuToggle);
    });
}





// Wikidot module
// 1. foldable-list
export const foldableMenuToggle = (event: Event) => {
    let target = event.target;

    if (!(target instanceof HTMLElement)) {
        return;
    }

    if (target?.tagName === "A" && target.href !== "#" && !target.href.startsWith("javascript:")) {
        return;
    }

    while (target && target.tagName.toLowerCase() !== "li") {
        target = target.parentNode as HTMLElement | null;
    }

    if (!target) return;

    if (!target.classList.contains("folded") && !target.classList.contains("unfolded")) {
        return;
    }

    if (target.classList.contains("folded")) {
        target.classList.replace("folded", "unfolded");
        const list = target.querySelector("ul");
        if (list) {
            list.style.display = "";
        }
    } else {
        target.classList.replace("unfolded", "folded");
        const list = target.querySelector("ul");
        if (list) {
            list.style.display = "none";
        }
    }
};