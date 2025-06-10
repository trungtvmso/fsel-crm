# Cấu Hình AlertMessage (`public/alert-settings.json`)

File `public/alert-settings.json` cho phép tùy chỉnh giao diện và hành vi của các thông báo (AlertMessage) trong ứng dụng.

**QUAN TRỌNG:** File JSON chuẩn không hỗ trợ comment. Mọi giải thích dưới đây chỉ mang tính chất tham khảo và không được đưa vào file `.json` thực tế.

## Cấu Trúc Tổng Quan

```json
{
  "position": "top-right",
  "defaultShowDismissButton": true,
  "duration": 3000, 
  "types": {
    "info": { /* ... Cài đặt cho type 'info' ... */ },
    "success": { /* ... Cài đặt cho type 'success' ... */ },
    "error": { /* ... Cài đặt cho type 'error' ... */ },
    "warning": { /* ... Cài đặt cho type 'warning' ... */ }
  }
}
```

## Các Thuộc Tính Cấu Hình Cấp Cao Nhất

### 1. `position`
- **Mô tả:** Xác định vị trí hiển thị của container chứa các thông báo trên màn hình.
- **Kiểu dữ liệu:** `string`
- **Các giá trị hợp lệ và ý nghĩa:**
  - `"top-left"`: Phía trên, bên trái màn hình.
  - `"top-center"`: Phía trên, ở giữa màn hình.
  - `"top-right"`: Phía trên, bên phải màn hình (mặc định khi khởi tạo).
  - `"bottom-left"`: Phía dưới, bên trái màn hình.
  - `"bottom-center"`: Phía dưới, ở giữa màn hình.
  - `"bottom-right"`: Phía dưới, bên phải màn hình.
- **Ví dụ:** `"position": "bottom-center"`

### 2. `defaultShowDismissButton`
- **Mô tả:** Xác định xem nút "x" (để đóng thông báo) có được hiển thị mặc định hay không.
- **Kiểu dữ liệu:** `boolean`
- **Các giá trị hợp lệ:**
  - `true`: Hiển thị nút đóng.
  - `false`: Ẩn nút đóng.
- **Lưu ý:** Nếu `duration` được đặt là `0` (hiển thị vô hạn), nút đóng sẽ rất cần thiết.
- **Ví dụ:** `"defaultShowDismissButton": true`

### 3. `duration`
- **Mô tả:** Thời gian hiển thị mặc định của thông báo (tính bằng mili giây - ms) trước khi tự động ẩn đi. Thiết lập này áp dụng chung cho tất cả các loại thông báo.
- **Kiểu dữ liệu:** `number`
- **Giá trị:**
  - Số nguyên dương (ví dụ: `3000` cho 3 giây).
  - `0`: Thông báo sẽ không tự động ẩn và cần người dùng nhấn nút đóng (nếu `defaultShowDismissButton` là `true`).
  - Nếu thuộc tính này bị bỏ qua trong file JSON, giá trị mặc định từ code (thường là 3000ms) sẽ được sử dụng.
- **Ví dụ:** `"duration": 3000`

### 4. `types`
- **Mô tả:** Một đối tượng chứa các cài đặt chi tiết cho từng loại thông báo (`info`, `success`, `error`, `warning`). Mỗi loại thông báo là một key trong đối tượng này.
- **Kiểu dữ liệu:** `object`

#### 4.1. Cài Đặt Cho Từng Loại Thông Báo (ví dụ: `types.info`)

Mỗi loại thông báo (ví dụ: `info`) có thể có các thuộc tính sau (lưu ý: `duration` đã được chuyển lên cấp cao nhất):

##### `backgroundColor`
- **Mô tả:** Màu nền của thông báo.
- **Kiểu dữ liệu:** `string`
- **Giá trị:** Chuỗi màu CSS hợp lệ (ví dụ: mã Hex như `#FF0000`, `rgba(255, 0, 0, 0.5)`).
- **Ví dụ:** `"backgroundColor": "rgba(30, 58, 138, 0.8)"` (màu xanh dương với độ mờ)

##### `borderColor`
- **Mô tả:** Màu của đường viền thông báo.
- **Kiểu dữ liệu:** `string`
- **Giá trị:** Chuỗi màu CSS hợp lệ.
- **Ví dụ:** `"borderColor": "#2563eb"`

##### `textColor`
- **Mô tả:** Màu chữ của nội dung thông báo.
- **Kiểu dữ liệu:** `string`
- **Giá trị:** Chuỗi màu CSS hợp lệ.
- **Ví dụ:** `"textColor": "#bfdbfe"`

##### `borderWidth` (Tùy chọn)
- **Mô tả:** Độ dày của đường viền.
- **Kiểu dữ liệu:** `string`
- **Giá trị:** Chuỗi giá trị CSS hợp lệ cho `border-width` (ví dụ: `"1px"`, `"2px"`, `"0px"` để ẩn viền). Nếu không cung cấp, mặc định là `"1px"` khi có `borderColor`.
- **Ví dụ:** `"borderWidth": "1px"`

##### `borderStyle` (Tùy chọn)
- **Mô tả:** Kiểu của đường viền.
- **Kiểu dữ liệu:** `string`
- **Giá trị:** Chuỗi giá trị CSS hợp lệ cho `border-style` (ví dụ: `"solid"`, `"dashed"`, `"dotted"`). Nếu không cung cấp, mặc định là `"solid"` khi có `borderColor`.
- **Ví dụ:** `"borderStyle": "solid"`

##### `layout` (Tùy chọn)
- **Mô tả:** Một đối tượng chứa các class của Tailwind CSS để tùy chỉnh các thuộc tính layout của thông báo.
- **Kiểu dữ liệu:** `object`

###### `layout.padding`
- **Mô tả:** Class Tailwind CSS cho padding (khoảng đệm bên trong).
- **Ví dụ:** `"padding": "p-4"` (tương đương padding 1rem)

###### `layout.shadow`
- **Mô tả:** Class Tailwind CSS cho hiệu ứng đổ bóng.
- **Ví dụ:** `"shadow": "shadow-lg"`

###### `layout.rounded`
- **Mô tả:** Class Tailwind CSS cho bo góc.
- **Ví dụ:** `"rounded": "rounded-lg"`

###### `layout.flex`
- **Mô tả:** Các class Tailwind CSS để thiết lập layout flex bên trong alert (thường dùng để căn chỉnh icon, text và nút đóng).
- **Ví dụ:** `"flex": "flex justify-between items-center"`

## Ví Dụ Đầy Đủ Cho Một Loại Thông Báo (Sau Khi Bỏ `duration`)

```json
    "info": {
      "backgroundColor": "rgba(30, 58, 138, 0.8)", 
      "borderColor": "#2563eb",                 
      "textColor": "#bfdbfe",                   
      "borderWidth": "1px",                     
      "borderStyle": "solid",                    
      "layout": {
        "padding": "p-4",          
        "shadow": "shadow-lg",     
        "rounded": "rounded-lg",   
        "flex": "flex justify-between items-center" 
      }
    }
```

## Lưu Ý Khi Chỉnh Sửa

- Luôn đảm bảo file `public/alert-settings.json` là một file JSON hợp lệ. Bạn có thể sử dụng các công cụ kiểm tra JSON online (JSON validator) để xác thực trước khi lưu.
- Nếu file JSON bị lỗi hoặc không tải được, ứng dụng sẽ sử dụng một bộ cài đặt mặc định được định nghĩa sẵn trong code.
- Sau khi chỉnh sửa file `alert-settings.json`, bạn có thể cần phải xóa cache trình duyệt và tải lại ứng dụng để thấy các thay đổi.