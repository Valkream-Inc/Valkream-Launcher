/**
 * @author Valkream Team
 * @license MIT - https://opensource.org/licenses/MIT
 */

const getForm = document.getElementById("getForm");
const postForm = document.getElementById("postForm");
const resultDiv = document.getElementById("result");
const zipInput = document.getElementById("post-zip");
const zipLabel = document.getElementById("zip-label");
const fileNameSpan = document.getElementById("file-name");
const getSubmitBtn = getForm.querySelector('button[type="submit"]');
const postSubmitBtn = postForm.querySelector('button[type="submit"]');

getForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  getSubmitBtn.disabled = true;
  postSubmitBtn.disabled = true;
  const endpoint = document.getElementById("get-endpoint").value;
  try {
    const res = await fetch(endpoint);
    const text = await res.text();
    try {
      const data = JSON.parse(text);
      resultDiv.innerHTML = `GET ${endpoint}:\n
      ${JSON.stringify(data, null, 2)}`;
    } catch {
      resultDiv.innerHTML = `GET ${endpoint} (réponse non-JSON):\n${text}`;
    }
  } catch (err) {
    resultDiv.innerHTML = `Erreur GET: ${
      err.message || err
    } 😢 Réessayez plus tard. 😉`;
  } finally {
    getSubmitBtn.disabled = false;
    postSubmitBtn.disabled = false;
  }
});

postForm.addEventListener("submit", async (e) => {
  e.preventDefault();
  postSubmitBtn.disabled = true;
  getSubmitBtn.disabled = true;
  const endpoint = document.getElementById("post-endpoint").value;
  const file = zipInput.files[0];
  let postData;
  try {
    postData = JSON.parse(document.getElementById("post-data").value);
  } catch (err) {
    resultDiv.innerHTML = `JSON invalide: ${err.message || err}`;
    postSubmitBtn.disabled = false;
    getSubmitBtn.disabled = false;
    return;
  }

  let fetchOptions = { method: "POST" };
  if (file) {
    const formData = new FormData();
    Object.entries(postData).forEach(([key, value]) =>
      formData.append(key, value)
    );
    formData.append("file", file);
    fetchOptions.body = formData;
  } else {
    try {
      fetchOptions.headers = { "Content-Type": "application/json" };
      fetchOptions.body = JSON.stringify(postData);
    } catch (err) {
      resultDiv.innerHTML = `JSON invalide: ${err.message || err}`;
      postSubmitBtn.disabled = false;
      getSubmitBtn.disabled = false;
      return;
    }
    fetchOptions.headers = { "Content-Type": "application/json" };
    fetchOptions.body = JSON.stringify(postData);
  }
  try {
    resultDiv.innerHTML = "Envoie...";
    const res = await fetch(endpoint, fetchOptions);
    const contentType = res.headers.get("content-type") || "";
    // Si la réponse est un flux texte (ex: text/event-stream), on lit ligne par ligne
    if (res.body && window.ReadableStream && contentType.includes("stream")) {
      resultDiv.innerHTML = "";
      const reader = res.body.getReader();
      const decoder = new TextDecoder("utf-8");
      let buffer = "";
      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        buffer += decoder.decode(value, { stream: true });
        let lines = buffer.split("\n");
        buffer = lines.pop();
        for (const line of lines) {
          if (line.trim() !== "") {
            resultDiv.innerHTML = "";
            resultDiv.insertAdjacentHTML("beforeend", line + "<br>");
            resultDiv.scrollTop = resultDiv.scrollHeight;
          }
        }
      }
      if (buffer && buffer.trim() !== "") {
        resultDiv.innerHTML = "";
        resultDiv.insertAdjacentHTML("beforeend", buffer + "<br>");
        resultDiv.scrollTop = resultDiv.scrollHeight;
      }
    } else {
      // Sinon, on affiche la réponse normalement (JSON ou texte)
      const text = await res.text();
      try {
        const data = JSON.parse(text);
        resultDiv.innerHTML = `POST ${endpoint}:<br><pre>${JSON.stringify(
          data,
          null,
          2
        )}</pre>`;
      } catch {
        resultDiv.innerHTML = `POST ${endpoint} (réponse non-JSON):<br>${text}`;
      }
    }
  } catch (err) {
    resultDiv.innerHTML = `Erreur GET: ${
      err.message || err
    } 😢 Réessayez plus tard. 😉`;
  } finally {
    postSubmitBtn.disabled = false;
    getSubmitBtn.disabled = false;
  }
});

zipInput.addEventListener("change", () => {
  if (zipInput.files.length > 0) {
    zipLabel.classList.add("file-selected");
    fileNameSpan.style.display = "inline";
    fileNameSpan.textContent = zipInput.files[0].name;
  } else {
    zipLabel.classList.remove("file-selected");
    fileNameSpan.style.display = "none";
    fileNameSpan.textContent = "";
  }
});
