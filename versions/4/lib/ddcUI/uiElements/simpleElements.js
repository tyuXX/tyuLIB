class SimpleLoadableBar {
    constructor(parent, width = "100%", height = "10px", borderRadius = "5px", backgroundColor = "#000", innerColor = "#fff") {
        this.bar = document.createElement("div");
        this.inner = document.createElement("div");
        this.bar.appendChild(this.inner);
        this.bar.classList.add("DDCUI-SimpleLoadableBar");
        this.value = 0;
        this.bar.style.width = width;
        this.bar.style.height = height;
        this.bar.style.borderRadius = borderRadius;
        this.bar.style.backgroundColor = backgroundColor;
        this.inner.style.width = "0%";
        this.inner.style.height = "98%";
        this.inner.style.backgroundColor = innerColor;
        this.inner.style.borderRadius = borderRadius;
        this.inner.style.transition = "width 0.5s ease";
        parent.appendChild(this.bar);
    }

    fill(value) {
        this.setValue(this.value + value);
    }

    setValue(value) {
        this.value = value;
        this.redraw();
    }

    redraw() {
        this.inner.style.width = this.value + "%";
    }
}