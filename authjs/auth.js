const baseUrl= "http://185.80.196.11:6003"

//start login

document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("contactForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); 

        const email = document.getElementById("name").value;
        const password = document.getElementById("password").value;

        try {
            const response = await fetch(`${baseUrl}api/auth/login`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ email, password })
            });

            const data = await response.json();

            if (response.ok) {
                const jwtToken = data.token || data.accessToken || data.jwt;
                if (!jwtToken) {
                    alert("JWT در پاسخ API پیدا نشد!");
                    return;
                }

                localStorage.setItem("jwtToken", jwtToken);
                alert("ورود موفق!");
                console.log("JWT:", jwtToken);

                window.location.href = "/hostingworld/index-3.html";

            } else {
                alert("خطا در ورود: " + (data.message || "اطلاعات اشتباه است"));
            }

        } catch (error) {
            console.error("خطا در اتصال به سرور:", error);
            alert("خطا در اتصال به سرور. دوباره تلاش کنید.");
        }
    });
});
//end log in 

//start register
document.addEventListener("DOMContentLoaded", () => {
    const form = document.getElementById("registerForm");

    form.addEventListener("submit", async (e) => {
        e.preventDefault(); 

        const firstName = document.getElementById("firstName").value;
        const lastName = document.getElementById("lastName").value;
        const email = document.getElementById("regEmail").value;
        const password = document.getElementById("regPassword").value;

        try {
            const response = await fetch(`${baseUrl}/api/auth/register`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({ firstName, lastName, email, password })
            });

            const data = await response.json();

            if (response.ok) {
                const jwtToken = data.token || data.accessToken || data.jwt;
                if (!jwtToken) {
                    alert("JWT در پاسخ API پیدا نشد!");
                    return;
                }

                localStorage.setItem("jwtToken", jwtToken);
                alert("ثبت نام موفق!");
                console.log("JWT:", jwtToken);

                window.location.href = "/hostingworld/index-3.html";

            } else {
                alert("خطا در ثبت نام: " + (data.message || "اطلاعات اشتباه است"));
            }

        } catch (error) {
            console.error("خطا در اتصال به سرور:", error);
            alert("خطا در اتصال به سرور. دوباره تلاش کنید.");
        }
    });
});
//end register