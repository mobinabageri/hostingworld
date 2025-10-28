// ============================================
// Multi-Domain Management System
// ============================================

class MultiDomainManager {
    constructor(config = {}) {
        this.api = new DomainManagementAPI(config);
        this.currentDomain = null;
        this.domains = [];
        this.filteredDomains = [];
        this.init();
    }

    /**
     * مقداردهی اولیه
     */
    async init() {
        try {
            this.showLoading();
            await this.loadDomains();
            this.attachEventListeners();
            this.hideLoading();
        } catch (error) {
            console.error('Initialization error:', error);
            this.showError('خطا در بارگذاری سیستم');
            this.hideLoading();
        }
    }

    /**
     * بارگذاری لیست دامنه‌ها
     */
    async loadDomains() {
        try {
            // شبیه‌سازی دریافت دامنه‌ها از API
            // در واقعیت باید از API دریافت شود
            const response = await this.api.request('/domains');
            
            if (response && response.domains) {
                this.domains = response.domains;
            } else {
                // داده‌های نمونه برای تست
                this.domains = [
                    {
                        id: 1,
                        name: 'example.com',
                        status: 'active',
                        expiration_date: '2025-12-15',
                        registration_date: '2023-01-10',
                        tld: '.com',
                        lock_enabled: true,
                        auto_renewal_enabled: true
                    },
                    {
                        id: 2,
                        name: 'mysite.ir',
                        status: 'active',
                        expiration_date: '2025-06-20',
                        registration_date: '2023-03-15',
                        tld: '.ir',
                        lock_enabled: true,
                        auto_renewal_enabled: false
                    },
                    {
                        id: 3,
                        name: 'business.co',
                        status: 'active',
                        expiration_date: '2025-09-10',
                        registration_date: '2023-05-01',
                        tld: '.co',
                        lock_enabled: false,
                        auto_renewal_enabled: true
                    }
                ];
            }

            this.filteredDomains = [...this.domains];
            this.renderDomainsList();
        } catch (error) {
            console.error('Error loading domains:', error);
            this.showError('خطا در بارگذاری دامنه‌ها');
        }
    }

    /**
     * رندر لیست دامنه‌ها
     */
    renderDomainsList() {
        const list = document.getElementById('domainsList');
        
        if (!list) return;

        if (this.filteredDomains.length === 0) {
            list.innerHTML = `
                <li class="no-domains-message">
                    <i class='bx bxs-info-circle'></i>
                    دامنه‌ای یافت نشد
                </li>
            `;
            return;
        }

        list.innerHTML = this.filteredDomains.map((domain, index) => `
            <li class="domain-item ${index === 0 ? 'active' : ''}" data-domain-id="${domain.id}" onclick="multiDomainManager.selectDomain(${domain.id})">
                <span class="domain-item-name">${domain.name}</span>
                <span class="domain-item-status">
                    ${domain.status === 'active' ? '✓ فعال' : '✗ غیرفعال'}
                </span>
            </li>
        `).join('');

        // انتخاب اولین دامنه به‌طور خودکار
        if (this.filteredDomains.length > 0 && !this.currentDomain) {
            this.selectDomain(this.filteredDomains[0].id);
        }
    }

    /**
     * انتخاب دامنه
     */
    async selectDomain(domainId) {
        try {
            this.showLoading();

            const domain = this.domains.find(d => d.id === domainId);
            if (!domain) {
                throw new Error('دامنه یافت نشد');
            }

            this.currentDomain = domain;
            this.api.setDomainId(domain.name);

            // به‌روزرسانی UI
            this.updateDomainUI(domain);
            this.updateActiveItem(domainId);
            this.loadDomainData(domain);

            // نمایش تب‌ها
            document.getElementById('contentPlaceholder').style.display = 'none';
            document.getElementById('tabsContainer').style.display = 'block';

            this.hideLoading();
        } catch (error) {
            console.error('Error selecting domain:', error);
            this.showError('خطا در انتخاب دامنه');
            this.hideLoading();
        }
    }

    /**
     * به‌روزرسانی آیتم فعال
     */
    updateActiveItem(domainId) {
        document.querySelectorAll('.domain-item').forEach(item => {
            item.classList.remove('active');
        });

        const activeItem = document.querySelector(`[data-domain-id="${domainId}"]`);
        if (activeItem) {
            activeItem.classList.add('active');
        }
    }

    /**
     * به‌روزرسانی UI دامنه
     */
    updateDomainUI(domain) {
        // صفحه‌ی اصلی
        document.getElementById('pageTitle').textContent = `مدیریت دامنه: ${domain.name}`;
        document.getElementById('pageSubtitle').textContent = `وضعیت: ${domain.status === 'active' ? 'فعال' : 'غیرفعال'}`;

        // Overview Tab
        document.getElementById('overviewDomainName').textContent = domain.name;
        document.getElementById('overviewStatus').textContent = domain.status === 'active' ? 'فعال' : 'غیرفعال';
        document.getElementById('overviewExpiration').textContent = this.formatDate(domain.expiration_date);
        document.getElementById('overviewDaysLeft').textContent = this.calculateDaysLeft(domain.expiration_date) + ' روز';

        // Info Table
        document.getElementById('infoDomainName').textContent = domain.name;
        document.getElementById('infoTLD').textContent = domain.tld;
        document.getElementById('infoRegistration').textContent = this.formatDate(domain.registration_date);
        document.getElementById('infoExpiration').textContent = this.formatDate(domain.expiration_date);
        document.getElementById('infoLock').textContent = domain.lock_enabled ? 'فعال (محافظت شده)' : 'غیرفعال';

        // Settings
        document.querySelector('input[name="domainLock"]').checked = domain.lock_enabled;
        document.querySelector('input[name="autoRenewal"]').checked = domain.auto_renewal_enabled;
    }

    /**
     * بارگذاری داده‌های دامنه
     */
    async loadDomainData(domain) {
        try {
            // بارگذاری DNS Records
            await this.loadDNSRecords();
        } catch (error) {
            console.error('Error loading domain data:', error);
        }
    }

    /**
     * بارگذاری رکوردهای DNS
     */
    async loadDNSRecords() {
        try {
            const response = await this.api.getDNSRecords();
            this.displayDNSRecords(response);
        } catch (error) {
            console.error('Error loading DNS records:', error);
            this.showError('خطا در بارگذاری رکوردهای DNS');
        }
    }

    /**
     * نمایش رکوردهای DNS
     */
    displayDNSRecords(data) {
        const tbody = document.getElementById('dnsRecordsTable');
        
        if (!tbody) return;

        if (!data.records || data.records.length === 0) {
            tbody.innerHTML = `
                <tr>
                    <td colspan="5" style="text-align: center; padding: 20px;">
                        هیچ رکوردی یافت نشد
                    </td>
                </tr>
            `;
            return;
        }

        tbody.innerHTML = data.records.map(record => `
            <tr>
                <td>${record.name || '@'}</td>
                <td><span class="record-type">${record.type}</span></td>
                <td>${this.truncateText(record.value, 50)}</td>
                <td>${record.ttl || 3600}</td>
                <td>
                    <div class="action-buttons">
                        <button class="btn-edit" onclick="multiDomainManager.editRecord(${record.id})">ویرایش</button>
                        <button class="btn-delete" onclick="multiDomainManager.deleteRecord(${record.id})">حذف</button>
                    </div>
                </td>
            </tr>
        `).join('');
    }

    /**
     * اتصال Event Listeners
     */
    attachEventListeners() {
        // جستجو در دامنه‌ها
        const searchInput = document.getElementById('domainsSearch');
        if (searchInput) {
            searchInput.addEventListener('input', (e) => this.searchDomains(e.target.value));
        }

        // فرم Nameserver
        const nsForm = document.getElementById('nameserverForm');
        if (nsForm) {
            nsForm.addEventListener('submit', (e) => this.handleNameserverSubmit(e));
        }

        // فرم تنظیمات
        const settingsForm = document.getElementById('settingsForm');
        if (settingsForm) {
            settingsForm.addEventListener('submit', (e) => this.handleSettingsSubmit(e));
        }

        // فرم رکورد DNS
        const recordForm = document.getElementById('recordForm');
        if (recordForm) {
            recordForm.addEventListener('submit', (e) => this.handleRecordSubmit(e));
        }

        // تب‌ها
        document.querySelectorAll('.tab-link').forEach(link => {
            link.addEventListener('click', (e) => this.switchTab(e));
        });

        // Checkboxes
        document.querySelector('input[name="domainLock"]')?.addEventListener('change', (e) => this.toggleDomainLock(e));
        document.querySelector('input[name="autoRenewal"]')?.addEventListener('change', (e) => this.toggleAutoRenewal(e));
    }

    /**
     * جستجو در دامنه‌ها
     */
    searchDomains(query) {
        query = query.toLowerCase().trim();

        if (!query) {
            this.filteredDomains = [...this.domains];
        } else {
            this.filteredDomains = this.domains.filter(domain =>
                domain.name.toLowerCase().includes(query)
            );
        }

        this.renderDomainsList();
    }

    /**
     * تعویض تب‌ها
     */
    switchTab(e) {
        e.preventDefault();

        const tabName = e.target.closest('.tab-link').getAttribute('data-tab');

        // حذف کلاس active از تمام تب‌ها و لینک‌ها
        document.querySelectorAll('.tab-link').forEach(link => link.classList.remove('active'));
        document.querySelectorAll('.tab-content').forEach(tab => tab.style.display = 'none');

        // اضافه کردن کلاس active
        e.target.closest('.tab-link').classList.add('active');
        const tab = document.getElementById(tabName);
        if (tab) {
            tab.style.display = 'block';
        }
    }

  /**
     * مدیریت ثبت فرم Nameserver
     */
    async handleNameserverSubmit(e) {
        e.preventDefault();

        try {
            this.showLoading();

            const nameservers = [];
            document.querySelectorAll('.nameserver-row').forEach((row, index) => {
                const inputs = row.querySelectorAll('input');
                const name = inputs[0]?.value;
                const ip = inputs[1]?.value;

                if (name) {
                    nameservers.push({
                        name: name.trim(),
                        ip: ip ? ip.trim() : null
                    });
                }
            });

            await this.api.updateNameservers(nameservers);
            
            this.showSuccess('Nameservers با موفقیت به‌روزرسانی شدند!');
            e.target.reset();
            
            setTimeout(() => this.loadDomainData(this.currentDomain), 1500);

        } catch (error) {
            this.showError('خطا: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * مدیریت ثبت فرم تنظیمات
     */
    async handleSettingsSubmit(e) {
        e.preventDefault();

        try {
            this.showLoading();

            const settings = {
                auto_renewal_enabled: document.querySelector('input[name="autoRenewal"]')?.checked || false,
                auto_renewal_days: parseInt(document.querySelector('select[name="autoRenewalDays"]')?.value) || 60
            };

            await this.api.updateDomainSettings(settings);
            
            this.showSuccess('تنظیمات با موفقیت ذخیره شدند!');

        } catch (error) {
            this.showError('خطا: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * مدیریت ثبت فرم رکورد DNS
     */
    async handleRecordSubmit(e) {
        e.preventDefault();

        try {
            this.showLoading();

            const record = {
                name: document.getElementById('recordName').value,
                type: document.getElementById('recordType').value,
                value: document.getElementById('recordValue').value,
                ttl: parseInt(document.getElementById('recordTTL').value),
                priority: document.getElementById('recordPriority').value ? 
                    parseInt(document.getElementById('recordPriority').value) : undefined
            };

            const recordId = e.target.dataset.recordId;

            if (recordId) {
                await this.api.updateDNSRecord(recordId, record);
                this.showSuccess('رکورد با موفقیت ویرایش شد!');
            } else {
                await this.api.addDNSRecord(record);
                this.showSuccess('رکورد جدید با موفقیت افزوده شد!');
            }

            this.closeRecordModal();
            setTimeout(() => this.loadDNSRecords(), 1500);

        } catch (error) {
            this.showError('خطا: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * ویرایش رکورد DNS
     */
    async editRecord(recordId) {
        try {
            this.showLoading();

            const record = await this.api.getDNSRecord(recordId);

            document.getElementById('recordName').value = record.name || '';
            document.getElementById('recordType').value = record.type;
            document.getElementById('recordValue').value = record.value;
            document.getElementById('recordTTL').value = record.ttl || 3600;
            document.getElementById('recordPriority').value = record.priority || '';

            document.getElementById('recordForm').dataset.recordId = recordId;
            document.getElementById('modalTitle').textContent = 'ویرایش رکورد';

            this.openRecordModal();
            this.hideLoading();

        } catch (error) {
            this.showError('خطا: ' + error.message);
            this.hideLoading();
        }
    }

    /**
     * حذف رکورد DNS
     */
    async deleteRecord(recordId) {
        if (!confirm('آیا مطمئن هستید که می‌خواهید این رکورد را حذف کنید؟')) {
            return;
        }

        try {
            this.showLoading();

            await this.api.deleteDNSRecord(recordId);
            
            this.showSuccess('رکورد با موفقیت حذف شد!');
            setTimeout(() => this.loadDNSRecords(), 1500);

        } catch (error) {
            this.showError('خطا: ' + error.message);
        } finally {
            this.hideLoading();
        }
    }

    /**
     * تغییر Domain Lock
     */
    async toggleDomainLock(e) {
        try {
            this.showLoading();

            await this.api.toggleDomainLock(e.target.checked);
            
            const message = e.target.checked ? 
                'قفل دامنه فعال شد' : 
                'قفل دامنه غیرفعال شد';
            this.showSuccess(message);

        } catch (error) {
            this.showError('خطا: ' + error.message);
            e.target.checked = !e.target.checked;
        } finally {
            this.hideLoading();
        }
    }

    /**
     * تغییر Auto Renewal
     */
    async toggleAutoRenewal(e) {
        try {
            this.showLoading();

            await this.api.toggleAutoRenewal(e.target.checked);
            
            const message = e.target.checked ? 
                'تمدید خودکار فعال شد' : 
                'تمدید خودکار غیرفعال شد';
            this.showSuccess(message);

        } catch (error) {
            this.showError('خطا: ' + error.message);
            e.target.checked = !e.target.checked;
        } finally {
            this.hideLoading();
        }
    }

    /**
     * باز کردن Modal رکورد
     */
    openRecordModal() {
        const modal = document.getElementById('recordModal');
        if (modal) {
            modal.classList.add('active');
        }
    }

    /**
     * بستن Modal رکورد
     */
    closeRecordModal() {
        const modal = document.getElementById('recordModal');
        if (modal) {
            modal.classList.remove('active');
            document.getElementById('recordForm').reset();
            document.getElementById('recordForm').removeAttribute('data-record-id');
            document.getElementById('modalTitle').textContent = 'افزودن رکورد جدید';
        }
    }

    /**
     * به‌روزرسانی متن کمکی برای نوع رکورد
     */
    updateRecordTypeHelp() {
        const type = document.getElementById('recordType').value;
        const helpElement = document.getElementById('recordTypeHelp');
        
        if (!helpElement) return;

        const helpTexts = {
            'A': 'آدرس IPv4 (مثال: 192.168.1.1)',
            'AAAA': 'آدرس IPv6 (مثال: 2001:0db8:85a3:0000)',
            'CNAME': 'نام دامنه هدف (مثال: example.com)',
            'MX': 'سرور ایمیل (مثال: mail.example.com)',
            'TXT': 'متن (مثال: v=spf1 include:_spf.google.com ~all)',
            'NS': 'نام سرور (مثال: ns1.example.com)',
            'SRV': 'سرویس (مثال: 0 0 5060 sipserver.example.com)'
        };

        helpElement.textContent = helpTexts[type] || '';

        // نمایش/مخفی کردن فیلد اولویت برای MX
        const priorityField = document.getElementById('recordPriority')?.parentElement;
        if (priorityField) {
            priorityField.style.display = type === 'MX' ? 'block' : 'none';
        }
    }

    /**
     * نمایش پیام موفقیت
     */
    showSuccess(message) {
        const alert = document.createElement('div');
        alert.className = 'alert-box alert-success';
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2000;
            max-width: 400px;
            animation: slideIn 0.3s ease-out;
        `;
        alert.innerHTML = `
            <i class='bx bxs-check-circle'></i>
            <span>${message}</span>
        `;
        document.body.appendChild(alert);

        setTimeout(() => {
            alert.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => alert.remove(), 300);
        }, 3000);
    }

    /**
     * نمایش پیام خطا
     */
    showError(message) {
        const alert = document.createElement('div');
        alert.className = 'alert-box';
        alert.style.cssText = `
            position: fixed;
            top: 20px;
            right: 20px;
            z-index: 2000;
            max-width: 400px;
            background: #ffe8e8;
            color: #FF6B6B;
            border-left: 4px solid #FF6B6B;
            padding: 15px 20px;
            border-radius: 6px;
            display: flex;
            align-items: center;
            gap: 12px;
            animation: slideIn 0.3s ease-out;
        `;
        alert.innerHTML = `
            <i class='bx bxs-x-circle'></i>
            <span>${message}</span>
        `;
        document.body.appendChild(alert);

        setTimeout(() => {
            alert.style.animation = 'slideOut 0.3s ease-out';
            setTimeout(() => alert.remove(), 300);
        }, 4000);
    }

    /**
     * نمایش لودینگ
     */
    showLoading() {
        const preloader = document.querySelector('.preloader');
        if (preloader) {
            preloader.style.display = 'flex';
        }
    }

    /**
     * مخفی کردن لودینگ
     */
    hideLoading() {
        const preloader = document.querySelector('.preloader');
        if (preloader) {
            preloader.style.display = 'none';
        }
    }

    /**
     * فرمت کردن تاریخ
     */
    formatDate(dateString) {
        const date = new Date(dateString);
        const options = { year: 'numeric', month: '2-digit', day: '2-digit' };
        return date.toLocaleDateString('fa-IR', options);
    }

    /**
     * محاسبه روزهای باقی‌مانده
     */
    calculateDaysLeft(expirationDate) {
        const today = new Date();
        const expDate = new Date(expirationDate);
        const diffTime = expDate - today;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return Math.max(0, diffDays);
    }

    /**
     * کوتاه کردن متن
     */
    truncateText(text, maxLength) {
        if (text.length > maxLength) {
            return text.substring(0, maxLength) + '...';
        }
        return text;
    }
}

// ============================================
// Global Functions
// ============================================

let multiDomainManager;

document.addEventListener('DOMContentLoaded', function() {
    // مقداردهی سیستم
    multiDomainManager = new MultiDomainManager({
        baseURL: 'http://localhost:5000/api',
        token: localStorage.getItem('auth_token'),
        timeout: 10000
    });
});

/**
 * تابع جهانی برای ویرایش رکورد
 */
function editRecord(recordId) {
    if (multiDomainManager) {
        multiDomainManager.editRecord(recordId);
    }
}

/**
 * تابع جهانی برای حذف رکورد
 */
function deleteRecord(recordId) {
    if (multiDomainManager) {
        multiDomainManager.deleteRecord(recordId);
    }
}

/**
 * تابع جهانی برای باز کردن Modal
 */
function openAddRecordModal() {
    if (multiDomainManager) {
        document.getElementById('recordForm').removeAttribute('data-record-id');
        document.getElementById('modalTitle').textContent = 'افزودن رکورد جدید';
        multiDomainManager.openRecordModal();
    }
}

/**
 * تابع جهانی برای بستن Modal
 */
function closeRecordModal() {
    if (multiDomainManager) {
        multiDomainManager.closeRecordModal();
    }
}

/**
 * به‌روزرسانی متن کمکی
 */
function updateRecordTypeHelp() {
    if (multiDomainManager) {
        multiDomainManager.updateRecordTypeHelp();
    }
}

// ============================================
// CSS Animations
// ============================================

const style = document.createElement('style');
style.textContent = `
    @keyframes slideIn {
        from {
            transform: translateX(400px);
            opacity: 0;
        }
        to {
            transform: translateX(0);
            opacity: 1;
        }
    }

    @keyframes slideOut {
        from {
            transform: translateX(0);
            opacity: 1;
        }
        to {
            transform: translateX(400px);
            opacity: 0;
        }
    }

    @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
    }

    .preloader {
        display: none;
        position: fixed;
        top: 0;
        left: 0;
        width: 100%;
        height: 100%;
        background: rgba(0, 0, 0, 0.5);
        z-index: 9999;
        align-items: center;
        justify-content: center;
    }

    .loader-in {
        color: white;
        font-size: 18px;
        font-weight: 600;
    }
`;
document.head.appendChild(style);