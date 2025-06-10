# Hướng Dẫn Build và Triển Khai Ứng Dụng

Đây là hướng dẫn để build ứng dụng React của bạn thành các file tĩnh và chuẩn bị cho việc triển khai lên một server sử dụng Nginx.

## 1. Yêu Cầu Môi Trường Build

- **Node.js và npm (hoặc yarn):** Đảm bảo bạn đã cài đặt Node.js (phiên bản LTS được khuyến nghị) và npm (đi kèm với Node.js) hoặc yarn.
  - Tải Node.js: [https://nodejs.org/](https://nodejs.org/)

## 2. Cài Đặt `esbuild`

`esbuild` là một công cụ build JavaScript/TypeScript rất nhanh. Chúng ta sẽ sử dụng nó để biên dịch và đóng gói ứng dụng.

Nếu bạn chưa cài đặt `esbuild`, bạn có thể cài đặt nó global hoặc dùng `npx` để chạy mà không cần cài global. Để đơn giản, chúng ta sẽ dùng `npx`.

## 3. Quá Trình Build

Các bước sau sẽ tạo ra một thư mục `dist` chứa tất cả các file cần thiết để triển khai.

### Bước 3.1: Chuẩn bị API Key

Ứng dụng của bạn sử dụng Gemini API và cần một API Key. Biến môi trường `API_KEY` được tham chiếu trong `services/geminiService.ts` thông qua `process.env.API_KEY`.

Khi build, bạn cần thay thế `YOUR_GEMINI_API_KEY_HERE` trong lệnh `esbuild` dưới đây bằng API key thực tế của bạn.

**QUAN TRỌNG VỀ BẢO MẬT API KEY:**
Việc nhúng API key trực tiếp vào code JavaScript phía client chỉ nên làm nếu API key đó được thiết kế cho mục đích này và có các biện pháp bảo vệ khác (ví dụ, giới hạn theo tên miền, quyền chỉ đọc). Nếu API key của bạn nhạy cảm, hãy cân nhắc sử dụng một backend proxy.

### Bước 3.2: Tạo thư mục `dist`

Trong thư mục gốc của dự án, hãy tạo một thư mục tên là `dist`:

```bash
mkdir dist
```

### Bước 3.3: Chạy lệnh `esbuild`

Mở terminal hoặc command prompt trong thư mục gốc của dự án và chạy lệnh sau.
**Lưu ý:** Thay thế `YOUR_GEMINI_API_KEY_HERE` bằng API key của bạn.

```bash
npx esbuild index.tsx --bundle --outfile=dist/index.js --platform=browser --format=esm --jsx=automatic --loader:.ts=tsx --define:process.env.API_KEY='"YOUR_GEMINI_API_KEY_HERE"'
```

**Giải thích lệnh:**
- `npx esbuild index.tsx`: Chạy `esbuild` với file đầu vào là `index.tsx`.
- `--bundle`: Đóng gói tất cả các module JavaScript/TypeScript phụ thuộc vào một file duy nhất.
- `--outfile=dist/index.js`: Chỉ định file đầu ra là `dist/index.js`.
- `--platform=browser`: Tối ưu hóa cho môi trường trình duyệt.
- `--format=esm`: Xuất ra định dạng ES Module.
- `--jsx=automatic`: Tự động xử lý JSX (sử dụng React 17+ JSX transform).
- `--loader:.ts=tsx`: Xử lý các file `.ts` như là `.tsx`.
- `--define:process.env.API_KEY='"YOUR_GEMINI_API_KEY_HERE"'`: Thay thế tất cả các lần xuất hiện của `process.env.API_KEY` trong code bằng chuỗi API key thực tế của bạn (được bọc trong dấu ngoặc kép phụ và ngoặc kép chính để đảm bảo nó là một chuỗi JavaScript hợp lệ).

### Bước 3.4: Sao chép các file tĩnh khác

Bạn cần sao chép các file và thư mục tĩnh khác vào thư mục `dist`:

- **`index.html`**: Sao chép file `index.html` đã được cập nhật (với script `src="./index.js"`) vào thư mục `dist`.
  ```bash
  cp index.html dist/index.html
  ```

- **Thư mục `locales`**: Chứa các file dịch JSON.
  ```bash
  cp -R locales dist/locales
  ```

- **Thư mục `lessionPlan`**: Chứa các file JSON kế hoạch bài học.
  ```bash
  cp -R lessionPlan dist/lessionPlan
  ```

- **Thư mục `public`**: Chứa các file public (ví dụ: `alert-settings.json`).
  ```bash
  cp -R public dist/public 
  ```
  *(Lưu ý: Nếu `alert-settings.json` nằm trực tiếp trong `public`, thì đường dẫn trong code (`fetch('/alert-settings.json')`) sẽ cần thư mục `public` được phục vụ từ gốc của server, hoặc bạn cần điều chỉnh đường dẫn fetch và vị trí copy.)*
  *Trong trường hợp hiện tại, `fetch('/alert-settings.json')` và `fetch('/locales/${lang}.json')` giả định rằng Nginx được cấu hình để phục vụ các file này từ thư mục gốc của site (ví dụ, `dist` là thư mục gốc). Do đó, việc copy `public/alert-settings.json` vào `dist/alert-settings.json` (hoặc `dist/public/alert-settings.json` và cấu hình Nginx tương ứng) là cần thiết. Để đơn giản, nếu `alert-settings.json` là file duy nhất trong `public` mà bạn cần, bạn có thể copy trực tiếp:*
  ```bash
  # Nếu alert-settings.json là file duy nhất bạn cần từ public:
  # cp public/alert-settings.json dist/alert-settings.json 
  # Hoặc nếu bạn muốn giữ cấu trúc public:
  cp -R public dist/public
  ```
  *Dựa trên code `fetch('/alert-settings.json')`, tốt nhất là `alert-settings.json` nằm ở gốc của `dist` hoặc Nginx được cấu hình để tìm thấy nó trong `public`.*
  *Để đơn giản nhất cho cấu hình Nginx cơ bản, hãy đặt `alert-settings.json` vào gốc `dist`:*
  ```bash
  cp public/alert-settings.json dist/alert-settings.json
  ```


- **`metadata.json`**:
  ```bash
  cp metadata.json dist/metadata.json
  ```

**Cấu trúc thư mục `dist` sau khi build sẽ trông giống như sau:**
```
dist/
├── index.html
├── index.js
├── locales/
│   ├── en.json
│   └── vi.json
├── lessionPlan/
│   ├── Aca/
│   │   ├── a1.json
│   │   └── ...
│   ├── EnglishFoundation/
│   │   └── ...
│   └── IeltsPathway/
│       └── ...
├── alert-settings.json  (nếu bạn copy trực tiếp file này)
└── metadata.json
```

## 4. Triển Khai Lên Nginx

Sau khi bạn đã có thư mục `dist` với tất cả các file đã build và các tài sản tĩnh:
1.  **Sao chép thư mục `dist` lên server của bạn:**
    Sử dụng `scp`, `rsync` hoặc công cụ FTP để tải toàn bộ nội dung thư mục `dist` lên server, ví dụ vào `/var/www/your-app-name`.
    ```bash
    # Ví dụ từ máy local:
    scp -r dist/* your_username@your_server_ip:/var/www/your-app-name/
    ```
2.  **Cấu hình Nginx:**
    Thực hiện theo hướng dẫn cấu hình Nginx mà tôi đã cung cấp trước đó. Đảm bảo rằng `root` trong file cấu hình Nginx của bạn trỏ đến thư mục chứa nội dung của `dist` (ví dụ: `/var/www/your-app-name`).
    Một cấu hình Nginx cơ bản:
    ```nginx
    server {
        listen 80;
        server_name yourdomain.com www.yourdomain.com; # Hoặc IP server

        root /var/www/your-app-name; # Đường dẫn đến thư mục dist của bạn
        index index.html;

        location / {
            try_files $uri $uri/ /index.html;
        }
        
        # Đảm bảo Nginx phục vụ JSON files với đúng MIME type (thường tự động)
        location ~ \.json$ {
            add_header Content-Type application/json;
        }
    }
    ```
3.  **Kiểm tra và Reload Nginx:**
    ```bash
    sudo nginx -t
    sudo systemctl reload nginx
    ```

Bây giờ, ứng dụng của bạn sẽ được phục vụ bởi Nginx từ các file tĩnh đã build.
