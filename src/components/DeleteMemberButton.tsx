"use client";

export default function DeleteMemberButton({ memberId }: { memberId: string }) {
  return (
    <button 
      type="submit" 
      className="btn btn-danger btn-sm" 
      onClick={(e) => {
        if (!confirm("Bạn có chắc chắn muốn xóa thành viên này? Hành động này không thể hoàn tác.")) {
          e.preventDefault();
        }
      }}
    >
      Xóa
    </button>
  );
}
