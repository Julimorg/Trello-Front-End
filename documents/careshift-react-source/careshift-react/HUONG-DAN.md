# CareShift React — Hướng dẫn chạy

Source của bản React đã xuất bản, giữ nguyên mã ứng dụng và CSS.

## Yêu cầu
Node.js >= 22.13.0 và pnpm 11.25.0.

## Chạy local
Trong thư mục careshift-react sau khi giải nén:

```sh
npm install -g pnpm@11.25.0
pnpm install --frozen-lockfile
pnpm dev
```

Mở địa chỉ được terminal hiển thị (mặc định http://localhost:5173).

## Build
```sh
pnpm build
pnpm start
```

## Mã chính
- app/page.jsx: state và tương tác React.
- app/care-views.jsx: các màn hình và dữ liệu mẫu.
- app/styles.css, app/mobile-nav.css, app/family-link.css: giao diện.
- scripts/check-views.cjs: kiểm tra render các màn hình.

Đây là prototype dùng dữ liệu mẫu trong bộ nhớ. Tải lại trang sẽ reset dữ liệu.
SOS, lời mời người thân và thông báo không gửi tới người thật.
Script scripts/migrate-care.mjs là công cụ chuyển đổi một lần từ source HTML cũ;
không cần chạy script này để cài đặt, chạy hay chỉnh sửa bản React.

File ZIP không chứa node_modules, build output, lịch sử Git hoặc credentials.
README.md gốc mô tả starter Vinext/React dùng cho dự án.
