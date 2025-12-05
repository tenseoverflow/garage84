import {
  deleteUser,
  EmailAuthProvider,
  onAuthStateChanged,
  reauthenticateWithCredential,
  updatePassword,
  updateProfile,
} from "firebase/auth";

import { auth } from "./firebase.js";

/* FIELD ELEMENTS */
const fields = {
  name: {
    display: document.getElementById("name-display"),
    edit: document.getElementById("name-edit"),
    input: document.getElementById("name-input"),
    saveBtn: document.getElementById("save-name"),
    valueSpan: document.getElementById("name-value"),
    save: async (val) => {
      await updateProfile(auth.currentUser, { displayName: val });
      document.getElementById("profile-name").textContent = val;
    },
  },

  password: {
    display: document.getElementById("password-display"),
    edit: document.getElementById("password-edit"),
    inputNew: document.getElementById("password-new"),
    inputRepeat: document.getElementById("password-repeat"),
    saveBtn: document.getElementById("save-password"),
    save: async (_, newPass) => {
      await updatePassword(auth.currentUser, newPass);
    },
  },
};

/* LOAD USER INFO */
onAuthStateChanged(auth, (user) => {
  if (!user) return;

  const name = user.displayName || "Kasutaja";
  const email = user.email;

  const avatar = document.getElementById("profile-avatar");
  avatar.textContent = name.charAt(0).toUpperCase();

  document.getElementById("profile-name").textContent = name;
  document.getElementById("profile-email").textContent = email;

  fields.name.valueSpan.textContent = name;
  fields.email.valueSpan.textContent = email;
});

/* OPEN EDIT MODE */
document.querySelectorAll(".edit-btn").forEach((btn) => {
  btn.addEventListener("click", () => {
    const key = btn.dataset.field;
    const field = fields[key];

    // open editor
    field.display.classList.add("hidden");
    field.edit.classList.remove("hidden");
    field.saveBtn.classList.remove("hidden");

    // preload input values
    if (key === "password") {
      field.inputNew.value = "";
      field.inputRepeat.value = "";
    } else {
      field.input.value = field.valueSpan.textContent;
    }
  });
});

/* SAVE HANDLERS */
Object.entries(fields).forEach(([key, field]) => {
  field.saveBtn.addEventListener("click", async () => {
    try {
      if (key === "password") {
        const p1 = field.inputNew.value;
        const p2 = field.inputRepeat.value;

        if (p1 !== p2) return alert("Paroolid ei ühti!");
        await field.save(null, p1);
        alert("Parool uuendatud!");
      } else {
        const newValue = field.input.value.trim();
        if (!newValue) return alert("Väli ei saa olla tühi!");

        await field.save(newValue);
        field.valueSpan.textContent = newValue;
      }

      // close editor
      field.edit.classList.add("hidden");
      field.display.classList.remove("hidden");
      field.saveBtn.classList.add("hidden");
    } catch (err) {
      alert("Tekkis viga: " + err.message);
    }
  });
});

/* DELETE ACCOUNT */
document
  .getElementById("delete-account")
  .addEventListener("click", async () => {
    if (!confirm("Oled sa kindel? Seda ei saa tagasi võtta.")) return;

    const password = prompt("Sisesta oma parool kinnitamiseks:");
    if (!password) return;

    try {
      const user = auth.currentUser;
      const credential = EmailAuthProvider.credential(user.email, password);
      await reauthenticateWithCredential(user, credential);
      await deleteUser(user);
      alert("Konto kustutatud.");
      window.location.href = "/signup/";
    } catch (err) {
      if (err.code === "auth/wrong-password") {
        alert("Vale parool. Proovi uuesti.");
      } else if (err.code === "auth/invalid-credential") {
        alert("Vale parool. Proovi uuesti.");
      } else {
        alert("Tekkis viga: " + err.message);
      }
    }
  });
