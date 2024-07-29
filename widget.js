document.addEventListener("DOMContentLoaded", function () {
    var loadCSS = function (url) {
        var link = document.createElement('link');
        link.rel = 'stylesheet';
        link.type = 'text/css';
        link.href = url;
        document.getElementsByTagName('head')[0].appendChild(link);
    };

    loadCSS('widget-son.css');

    const container = document.getElementById('iys-widget');
    container.style.display = "none";
    setTimeout(() => {
        container.style.display = "block";
    }, 500)
    const widget = document.createElement('div');
    widget.id = 'widget-container';

    widget.innerHTML = `
        <div class="iys-widget-container">
            <div class="input-group">
                <label class="radio-label">
                    <input type="radio" name="contact-method" value="phone" checked> Telefon
                </label>
                <label class="radio-label">
                    <input type="radio" name="contact-method" value="email"> E-posta
                </label>
            </div>

            <div class="input-group">
                <input type="text" id="phone-input" placeholder="(___) ___ __ __">
                <input type="text" id="email-input" placeholder="E-posta Adresi" style="display: none;">
            </div>

            <div id="captcha-container" class="input-group">
                <img id="captcha-image" src="" alt="Captcha Image">
                <button id="refresh-captcha">Yenile</button>
                <input type="text" id="captcha-input" placeholder="Resimdeki kodu giriniz">
            </div>

            <div style="margin: 10px;">
                <div id="consent-group" class="consent-group">
                    <p>Ticari Elektronik İlerinin gönderilmesiyle ilgili <a href="#" id="ticari-metni-link">Ticari Elektronik İleti İzni Metni</a>'ni okudum, onaylıyorum.</p>
                    <div>
                        <p>
                            <input type="checkbox" id="mesaj" name="permission" value="mesaj">
                            <label for="mesaj">Mesaj</label>
                        </p>
                    </div>
                    <div>
                        <p>
                            <input type="checkbox" id="arama" name="permission" value="arama" checked>
                            <label for="arama">Arama</label>
                        </p>
                    </div>
                </div>

                <hr>

                <div id="document-group" class="document-group">
                    <p>
                        <input type="checkbox" id="kisiler" name="privacy">
                        <label for="kisiler">Kişisel Verilerle ilgili <a href="#" id="aydinlatma-metni-link">Aydınlatma Metni</a>'ni okudum, bilgilendirildim.</label>
                    </p>
                </div>
            </div>

            <button id="start-process" class="via-btn">Onay Veriyorum - OTP Gönder</button>

            <div id="otp-section" style="display: none;">
                <input type="text" id="otp-input" placeholder="OTP Kodu">
                <button id="complete-process" class="via-btn">Doğrula</button>
                <div id="otp-timer">OTP kodu doğrulaması için <span id="timer">45</span> saniye kaldı</div>
            </div>

            <button id="retry-button" class="via-btn" style="display: none;">Tekrar Dene</button>

            <div id="message"></div>
            <div id="notification" style="display: none;"></div>
        </div>
    `;
    container.appendChild(widget);

    const phoneInput = document.getElementById('phone-input');
    const emailInput = document.getElementById('email-input');
    const contactMethodRadios = document.querySelectorAll('input[name="contact-method"]');
    const startProcessButton = document.getElementById('start-process');
    const otpSection = document.getElementById('otp-section');
    const completeProcessButton = document.getElementById('complete-process');
    const retryButton = document.getElementById('retry-button');
    const messageDiv = document.getElementById('message');
    const notificationDiv = document.getElementById('notification');
    const captchaContainer = document.getElementById('captcha-container');
    const captchaImage = document.getElementById('captcha-image');
    const captchaInput = document.getElementById('captcha-input');
    const refreshCaptchaButton = document.getElementById('refresh-captcha');
    const timerSpan = document.getElementById('timer');

    const consentGroup = document.getElementById('consent-group');
    const documentGroup = document.getElementById('document-group');

    let timer;

    // Function to format phone number input
    const formatPhoneNumber = (input) => {
        input = input.replace(/\D/g, '');
        input = input.substring(0, 10);
        const size = input.length;
        if (size > 0) {
            input = '(' + input;
        }
        if (size > 3) {
            input = input.substring(0, 4) + ') ' + input.substring(4);
        }
        if (size > 6) {
            input = input.substring(0, 9) + ' ' + input.substring(9);
        }
        if (size > 8) {
            input = input.substring(0, 12) + ' ' + input.substring(12);
        }
        return input;
    };

    // Event listener for phone input formatting
    phoneInput.addEventListener('input', (e) => {
        e.target.value = formatPhoneNumber(e.target.value);
    });

    // Event listeners for the pop-up links
    document.getElementById('ticari-metni-link').addEventListener('click', (e) => {
        e.preventDefault();
        window.open('https://www.nissan.com.tr/content/dam/Nissan/turkey/KVKK/tr-nissan-ticari-elektronik-ileti-izni-15.11.2022.pdf', 'Ticari Elektronik İleti İzni Metni', 'width=800,height=600,scrollbars=yes,resizable=yes');
    });

    document.getElementById('aydinlatma-metni-link').addEventListener('click', (e) => {
        e.preventDefault();
        window.open('https://www.kvkk.gov.tr/yayinlar/cerezlere_dair_aydinlatma_metni.pdf', 'Aydınlatma Metni', 'width=800,height=600,scrollbars=yes,resizable=yes');
    });

    let requestId = '';
    let captchaId = '';

    contactMethodRadios.forEach(radio => {
        radio.addEventListener('change', function () {
            resetForm();
            if (this.value === 'phone') {
                phoneInput.style.display = 'block';
                emailInput.style.display = 'none';
            } else {
                phoneInput.style.display = 'none';
                emailInput.style.display = 'block';
            }
        });
    });

    const resetForm = () => {
        clearInterval(timer);
        phoneInput.value = '';
        phoneInput.disabled = false;
        emailInput.value = '';
        emailInput.disabled = false;
        startProcessButton.disabled = false;
        startProcessButton.style.display = "block";
        otpSection.style.display = 'none';
        retryButton.style.display = 'none';
        document.getElementById('otp-input').value = '';
        messageDiv.textContent = '';
        messageDiv.className = '';
        notificationDiv.style.display = 'none';
        notificationDiv.innerHTML = '';
        requestId = '';
        captchaId = '';
        captchaInput.value = '';
        captchaContainer.style.display = 'none';
        consentGroup.style.display = "block";
        documentGroup.style.display = "flex";
        fetchCaptcha().then(() => {
            console.log('Captcha başarıyla alındı.');
        }).catch(error => {
            console.error('Captcha alınamadı:', error);
        });
    };

    const fetchCaptcha = () => {
        return fetch('http://localhost:3000/captcha/generate', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ "section": "VIA-WIDGET" })
        })
            .then(response => response.json())
            .then(data => {
                if (data.ok) {
                    captchaContainer.style.display = 'flex';
                    captchaImage.src = 'data:image/svg+xml;base64,' + btoa(data.payload.imageSvg);
                    captchaId = data.payload.cid;
                } else {
                    throw new Error('Captcha alınamadı.');
                }
            });
    };

    const refreshCaptcha = () => {
        fetchCaptcha().then(() => {
            console.log('Captcha başarıyla yenilendi.');
        }).catch(error => {
            console.error('Captcha yenilenemedi:', error);
        });
    };

    refreshCaptchaButton.addEventListener('click', refreshCaptcha);

    const startProcess = () => {
        const contactMethod = document.querySelector('input[name="contact-method"]:checked').value;
        const recipient = contactMethod === 'phone' ? phoneInput.value.replace(/\D/g, '') : emailInput.value;

        if (!recipient) {
            messageDiv.textContent = 'Lütfen geçerli bir telefon numarası veya e-posta adresi girin.';
            return;
        }

        const captchaCode = captchaInput.value;
        if (!captchaCode) {
            messageDiv.textContent = 'Lütfen Captcha kodunu girin.';
            return;
        }

        phoneInput.disabled = true;
        emailInput.disabled = true;
        startProcessButton.disabled = true;

        const data = {
            "consentTypes": [
                {
                    "title": "ETK",
                    "brandCodes": [630157],
                    "types": ["MESAJ", "ARAMA"],
                    "recipientType": "BIREYSEL"
                }
            ],
            "formId": "a2801eb6-eb55-4d60-bb20-1e256d0490dd",
            "recipient": `+90${recipient}`,
            "verificationType": "SMS_OTP",
            "captchaCode": captchaCode,
            "captchaId": captchaId,
            "iysCode": 630157
        };

        return fetch('http://localhost:3000/via-widget/start-consent', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                if (data.code === 'OK') {
                    requestId = data.message.requestId;
                    otpSection.style.display = 'block';
                    messageDiv.textContent = 'OTP kodu gönderildi. Lütfen kontrol edin.';
                    startProcessButton.style.display = "none";
                    consentGroup.style.display = "none";
                    documentGroup.style.display = "none";
                    captchaContainer.style.display = 'none';
                    startOtpTimer();
                } else if (data.error && data.error.fields && data.error.fields.some(field => field.name === 'captchaCode')) {
                    messageDiv.textContent = 'Güvenlik kodu hatalı. Lütfen tekrar deneyiniz.';
                    phoneInput.disabled = false;
                    emailInput.disabled = false;
                    startProcessButton.disabled = false;
                    fetchCaptcha();
                } else {
                    messageDiv.textContent = 'İstek gönderilirken bir hata oluştu.';
                    phoneInput.disabled = false;
                    emailInput.disabled = false;
                    startProcessButton.disabled = false;
                }
            })
            .catch(error => {
                messageDiv.textContent = 'İstek gönderilirken bir hata oluştu.';
                phoneInput.disabled = false;
                emailInput.disabled = false;
                startProcessButton.disabled = false;
            });
    };

    const completeProcess = () => {
        const otpCode = document.getElementById('otp-input').value;

        const data = {
            "requestId": requestId,
            "verificationType": "SMS_OTP",
            "consentTypes": [
                {
                    "title": "ETK",
                    "otpCode": otpCode
                }
            ],
            "iysCode": 630157
        };

        fetch('http://localhost:3000/via-widget/confirmation', {
            method: 'POST',
            headers: {
                'content-type': 'application/json'
            },
            body: JSON.stringify(data)
        })
            .then(response => response.json())
            .then(data => {
                if (data.code === 'OK') {
                    notificationDiv.style.display = 'block';
                    notificationDiv.innerHTML = '<h3>İşlem Başarıyla Tamamlandı</h3>';
                    data.message.forEach(item => {
                        notificationDiv.innerHTML += `
                    <p><strong>Transaction ID:</strong> ${item.transactionId}</p>
                    <p><strong>Creation Date:</strong> ${item.creationDate}</p>
                    <p><strong>Type:</strong> ${item.type}</p>
                    <p><strong>Brand Code:</strong> ${item.brandCode}</p>
                    <hr>
                `;
                    });
                    messageDiv.textContent = '';
                    messageDiv.className = 'success-message';
                    otpSection.style.display = 'none';
                    clearInterval(timer);
                } else {
                    messageDiv.textContent = 'Girilen otp kodu geçerli değildir.';
                    messageDiv.className = 'error-message';
                }
            })
            .catch(error => {
                messageDiv.textContent = 'İstek gönderilirken bir hata oluştu.';
                messageDiv.className = 'error-message';
            });
    };

    const startOtpTimer = () => {
        let timeLeft = 45;
        timerSpan.textContent = timeLeft;

        timer = setInterval(() => {
            timeLeft--;
            timerSpan.textContent = timeLeft;

            if (timeLeft <= 0) {
                clearInterval(timer);
                messageDiv.textContent = 'OTP kodu süresi doldu. Lütfen tekrar deneyin.';
                messageDiv.className = 'error-message';
                otpSection.style.display = 'none';
                retryButton.style.display = 'block';
                startProcessButton.style.display = 'none';
                phoneInput.disabled = false;
                emailInput.disabled = false;
                startProcessButton.disabled = false;
            }
        }, 1000);
    };

    const retryOTP = () => {
        const phone = phoneInput.value;
        const email = emailInput.value;
        resetForm();
        phoneInput.value = phone;
        emailInput.value = email;
    }

    startProcessButton.addEventListener('click', startProcess);
    completeProcessButton.addEventListener('click', completeProcess);
    retryButton.addEventListener('click', retryOTP);

    resetForm();
});
