// LOKASI: src/components/pages/manage-exams/[eventId]/exam-card-print.tsx
import React, { forwardRef } from 'react';

interface ExamCardPrintProps {
  student: any;
}

export const ExamCardPrint = forwardRef<HTMLDivElement, ExamCardPrintProps>(({ student }, ref) => {
  if (!student) return null;

  // --- LOGIKA DINAMIS: Penyesuaian font agar Nama Lembaga tetap SATU BARIS ---
  const instName = student.institution_name || "LEMBAGA PENDIDIKAN";
  const instFontSize = instName.length > 35 ? '8.5px' : instName.length > 25 ? '10px' : '11px';

  return (
    <div 
      ref={ref} 
      style={{ 
        width: '340px', // Dimensi Mutlak ~90mm
        height: '226px', // Dimensi Mutlak ~60mm
        backgroundColor: '#f8fcfb', // Warna latar halus sesuai KTS
        border: '1px solid #cbd5e1',
        boxSizing: 'border-box',
        display: 'flex',
        flexDirection: 'column',
        position: 'relative',
        overflow: 'hidden',
        fontFamily: 'Inter, system-ui, sans-serif',
        color: '#000000'
      }} 
      className="shrink-0"
    >
      {/* --- 0. WATERMARK LATAR BELAKANG (DNA KTS) --- */}
      <div style={{ 
        position: 'absolute', 
        inset: 0, 
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center', 
        opacity: '0.04', 
        pointerEvents: 'none', 
        zIndex: 0 
      }}>
        {student.logoUrl && (
          <img src={student.logoUrl} alt="Watermark" style={{ width: '180px', height: '180px', objectFit: 'contain', filter: 'grayscale(100%)' }} />
        )}
      </div>

      {/* ==================== 1. KOP SURAT PREMIUM ==================== */}
      <div style={{ display: 'flex', alignItems: 'center', height: '62px', padding: '6px 10px 0 10px', overflow: 'hidden', position: 'relative', zIndex: 1 }}>
        
        {/* LOGO KIRI */}
        <div style={{ width: '42px', height: '42px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
          {student.logoUrl ? (
            <img src={student.logoUrl} alt="Logo" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain', filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.1))' }} crossOrigin="anonymous" />
          ) : (
            <div style={{ width: '100%', height: '100%', border: '1px dashed #cbd5e1', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '8px', color: '#94a3b8', borderRadius: '4px' }}>LOGO</div>
          )}
        </div>

        {/* TEKS KOP (Standardisasi Tipografi) */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '0 6px', overflow: 'hidden' }}>
          <div style={{ fontSize: '9px', fontWeight: 900, color: '#047857', letterSpacing: '0.5px', textTransform: 'uppercase', lineHeight: '1.1' }}>
            YAYASAN KEBAJIKAN PESANTREN
          </div>
          <div style={{ 
            fontSize: instFontSize, 
            fontWeight: 900, 
            textTransform: 'uppercase', 
            lineHeight: '1.1', 
            marginBottom: '1px', 
            color: '#043425',
            whiteSpace: 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
            width: '100%' 
          }}>
            {instName}
          </div>
          
          <div style={{ fontSize: '5.5px', fontWeight: 700, color: '#475569', lineHeight: '1.2', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', width: '100%' }}>
             {student.address_detail || 'Jl. Gondang Manis No. 52 RT 002 RW 002 Desa Babakan'}
          </div>
          <div style={{ fontSize: '5.5px', fontWeight: 700, color: '#475569', lineHeight: '1.2' }}>
             {student.address_city || 'Cirebon - Jawa Barat'} {student.contact_phone && <span>| WA: {student.contact_phone}</span>}
          </div>
        </div>

        {/* QR CODE KANAN */}
        <div style={{ width: '42px', height: '42px', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden', backgroundColor: 'white', padding: '2px', borderRadius: '4px', border: '0.5px solid #e2e8f0' }}>
          {student.qrCodeUrl && (
            <img src={student.qrCodeUrl} alt="QR" style={{ maxWidth: '100%', maxHeight: '100%', objectFit: 'contain' }} />
          )}
        </div>
      </div>

      {/* DIVIDER TEGAS (DNA KTS) */}
      <div style={{ padding: '0 10px', marginTop: '2px', position: 'relative', zIndex: 1 }}>
        <div style={{ width: '100%', borderTop: '1.5px solid #043425' }}></div>
        <div style={{ width: '100%', borderTop: '0.5px solid #043425', marginTop: '1px' }}></div>
      </div>

      {/* ==================== 2. PITA JUDUL MODERN ==================== */}
      <div style={{ 
        backgroundColor: '#047857', 
        color: '#ffffff', 
        textAlign: 'center', 
        marginTop: '5px',
        height: '20px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        boxShadow: '0 1px 2px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 1
      }}>
        <span style={{ fontSize: '11px', fontWeight: 900, letterSpacing: '1.5px', textShadow: '0 1px 1px rgba(0,0,0,0.2)' }}>
          KARTU PESERTA UJIAN
        </span>
      </div>

      {/* ==================== 3. KONTEN UTAMA ==================== */}
      <div style={{ display: 'flex', flex: 1, padding: '8px 12px 4px 12px', position: 'relative', zIndex: 1 }}>
        
        {/* SISI KIRI: DATA PESERTA */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', paddingRight: '10px', overflow: 'hidden' }}>
          
          {/* NAMA PESERTA */}
          <div style={{ 
              fontSize: '12px', 
              fontWeight: 900, 
              color: '#043425',
              textTransform: 'uppercase',
              borderBottom: '1px dashed #cbd5e1',
              paddingBottom: '2px',
              marginBottom: '6px', 
              lineHeight: '1.1',
              display: '-webkit-box',
              WebkitLineClamp: 2,
              WebkitBoxOrient: 'vertical',
              overflow: 'hidden'
          }}>
              {student.student_name}
          </div>

          <div style={{ display: 'flex', gap: '6px', marginBottom: '8px' }}>  
            <InfoBox label="NISN" value={student.student_nisn} flex={1} />
            <InfoBox label="KELAS" value={student.room} flex={1.4} /> {/* Flex ditingkatkan agar ruang kelas lebih lebar */}
            <InfoBox label="NO. UJIAN" value={student.exam_number} flex={1.4} />
          </div>

          {/* KOTAK LOGIN KREDENSIAL */}
          <div style={{ 
              border: '1.5px solid #10b981', 
              backgroundColor: '#f0fdf4', 
              borderRadius: '6px',
              padding: '5px 8px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              height: '42px',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.05)'
          }}>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                <span style={{ fontSize: '6px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.3px' }}>USERNAME LOGIN</span>
                <span style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'monospace', color: '#064e3b', wordBreak: 'break-all', lineHeight: '1.1' }}>
                  {student.student_username}
                </span>
              </div>
              <div style={{ width: '1.5px', height: '100%', backgroundColor: '#10b981', opacity: 0.3 }}></div>
              <div style={{ flex: 1, display: 'flex', flexDirection: 'column', justifyContent: 'center', overflow: 'hidden' }}>
                <span style={{ fontSize: '6px', fontWeight: 800, color: '#059669', textTransform: 'uppercase', letterSpacing: '0.3px' }}>PASSWORD AKUN</span>
                <span style={{ fontSize: '12px', fontWeight: 900, fontFamily: 'monospace', color: '#064e3b', wordBreak: 'break-all', lineHeight: '1.1' }}>
                  {student.student_password}
                </span>
              </div>
          </div>
        </div>

        {/* SISI KANAN: FOTO PROFIL */}
        <div style={{ width: '64px', height: '84px', flexShrink: 0, marginTop: '2px' }}>
          <div style={{ 
            width: '100%', height: '100%',
            border: '2px solid #047857', 
            backgroundColor: '#ffffff', 
            borderRadius: '4px',
            display: 'flex', alignItems: 'center', justifyContent: 'center', 
            overflow: 'hidden',
            padding: '1.5px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            {student.photoUrl ? (
              <img src={student.photoUrl} alt="Foto" style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '1.5px' }} crossOrigin="anonymous" />
            ) : (
              <div style={{ textAlign: 'center', lineHeight: '1' }}>
                <span style={{ fontSize: '8px', fontWeight: 800, color: '#94a3b8' }}>FOTO<br/>3 x 4</span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* FOOTER & ACCENT BAR (DNA KTS) */}
      <div style={{ marginTop: 'auto', position: 'relative', zIndex: 1 }}>
        <div style={{ 
          padding: '0 12px 6px 12px',
          fontSize: '5px', 
          fontStyle: 'italic', 
          fontWeight: 700, 
          color: '#64748b',
          display: 'flex',
          justifyContent: 'space-between'
        }}>
          <span>Dicetak: {student.printDate}</span>
          <span style={{ marginLeft: 'auto' }}>© {student.institution_name || "YKP System"}</span>
        </div>
        
        {/* BAR GRADASI KHAS (Identitas Sistem) */}
        <div style={{ 
          width: '100%', 
          height: '10px', 
          background: 'linear-gradient(to right, #043425, #065f46, #043425)' 
        }}></div>
      </div>
    </div>
  );
});

const InfoBox = ({ label, value, flex = 1 }: { label: string, value: string, flex?: number }) => {
  // LOGIKA DINAMIS: Mengecilkan font nilai jika teks terlalu panjang (khususnya untuk KELAS)
  const displayValue = value || '-';
  const valFontSize = displayValue.length > 15 ? '7px' : displayValue.length > 10 ? '8px' : '9px';

  return (
    <div style={{ flex, display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
      <span style={{ fontSize: '5.5px', fontWeight: 800, color: '#64748b', textTransform: 'uppercase', marginBottom: '1px' }}>
        {label}
      </span>
      <div style={{ 
        border: '0.5px solid #cbd5e1', 
        backgroundColor: '#ffffff', 
        padding: '3px 4px', 
        borderRadius: '3px', 
        fontSize: valFontSize, // Menggunakan font size dinamis
        fontWeight: 800, 
        color: '#1e293b', 
        whiteSpace: 'nowrap', 
        overflow: 'hidden', 
        textOverflow: 'ellipsis',
        lineHeight: '1.2' // Memberikan ruang vertikal agar tidak terpotong atas-bawah
      }}>
        {displayValue}
      </div>
    </div>
  );
};

ExamCardPrint.displayName = 'ExamCardPrint';