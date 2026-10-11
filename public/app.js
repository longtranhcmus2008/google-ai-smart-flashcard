
const generateBtn = document.getElementById("generateBtn");
const wordInput = document.getElementById("wordInput");
const flashcardContainer = document.getElementById("flashcardContainer");
const btnText = document.getElementById("btnText");
const loadingSpinner = document.getElementById("loadingSpinner");

generateBtn.addEventListener("click", async () => {
    const word = wordInput.value.trim();

    if (!word) {
        alert("Vui lòng nhập từ vựng tiếng Anh!");
        return;
    }

    generateBtn.disabled = true;
    btnText.textContent = "Đang tạo...";
    loadingSpinner.classList.remove("hidden");

    try {
        const response = await fetch("http://localhost:3000/generate", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ word })
        });

        const data = await response.json();

        if (!response.ok) {
            throw new Error(data.error || "Không thể tạo flashcard.");
        }

        const card = document.createElement("div");
        card.className = "flashcard";

        const title = document.createElement("h2");
        title.textContent = data.word;

        const content = document.createElement("p");

        content.textContent = data.flashcard.replace(/\*\*/g, "");

        card.appendChild(title);
        card.appendChild(content);

        flashcardContainer.prepend(card);

    } catch (error) {
        console.error("Flashcard error:", error);
        alert(error.message || "Không thể tạo flashcard. Vui lòng thử lại.");
    } finally {
        generateBtn.disabled = false;
        btnText.textContent = "Generate with AI";
        loadingSpinner.classList.add("hidden");
    }
});
