import React, { useState, useRef } from 'react';
import * as XLSX from 'xlsx';
import { Question, GameSettings } from '../types/game';
import { DEFAULT_QUESTIONS } from '../utils/defaultQuestions';
import { 
  Settings, 
  FileSpreadsheet, 
  Download, 
  Upload, 
  Plus, 
  Trash2, 
  Edit3, 
  CheckCircle2, 
  Clock, 
  Trophy, 
  Heart, 
  RotateCcw,
  Sliders,
  AlertCircle
} from 'lucide-react';

interface QuestionManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  questions: Question[];
  onUpdateQuestions: (qs: Question[]) => void;
  settings: GameSettings;
  onUpdateSettings: (s: GameSettings) => void;
}

export const QuestionManagerModal: React.FC<QuestionManagerModalProps> = ({
  isOpen,
  onClose,
  questions,
  onUpdateQuestions,
  settings,
  onUpdateSettings,
}) => {
  const [activeTab, setActiveTab] = useState<'bank' | 'settings' | 'import'>('bank');
  const [editingQuestion, setEditingQuestion] = useState<Question | null>(null);
  const [importStatus, setImportStatus] = useState<string | null>(null);
  const [importError, setImportError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Form state for creating/editing question
  const [formCategory, setFormCategory] = useState<'Iklan' | 'Slogan' | 'Poster' | 'Umum'>('Iklan');
  const [formText, setFormText] = useState('');
  const [formOptA, setFormOptA] = useState('');
  const [formOptB, setFormOptB] = useState('');
  const [formOptC, setFormOptC] = useState('');
  const [formOptD, setFormOptD] = useState('');
  const [formCorrect, setFormCorrect] = useState<'A' | 'B' | 'C' | 'D'>('A');
  const [formExplanation, setFormExplanation] = useState('');

  if (!isOpen) return null;

  // Open edit modal
  const handleStartEdit = (q: Question) => {
    setEditingQuestion(q);
    setFormCategory(q.category);
    setFormText(q.question);
    setFormOptA(q.options.find(o => o.key === 'A')?.text || '');
    setFormOptB(q.options.find(o => o.key === 'B')?.text || '');
    setFormOptC(q.options.find(o => o.key === 'C')?.text || '');
    setFormOptD(q.options.find(o => o.key === 'D')?.text || '');
    setFormCorrect(q.correctAnswer);
    setFormExplanation(q.explanation || '');
  };

  const handleStartCreate = () => {
    setEditingQuestion({
      id: 'q_' + Date.now(),
      category: 'Iklan',
      question: '',
      options: [
        { key: 'A', text: '' },
        { key: 'B', text: '' },
        { key: 'C', text: '' },
        { key: 'D', text: '' },
      ],
      correctAnswer: 'A',
      explanation: '',
    });
    setFormCategory('Iklan');
    setFormText('');
    setFormOptA('');
    setFormOptB('');
    setFormOptC('');
    setFormOptD('');
    setFormCorrect('A');
    setFormExplanation('');
  };

  const handleSaveQuestion = () => {
    if (!formText.trim() || !formOptA.trim() || !formOptB.trim()) {
      alert('Harap isi pertanyaan dan minimal pilihan A dan B!');
      return;
    }

    const updated: Question = {
      id: editingQuestion ? editingQuestion.id : 'q_' + Date.now(),
      category: formCategory,
      question: formText.trim(),
      options: [
        { key: 'A', text: formOptA.trim() },
        { key: 'B', text: formOptB.trim() },
        { key: 'C', text: formOptC.trim() || '-' },
        { key: 'D', text: formOptD.trim() || '-' },
      ],
      correctAnswer: formCorrect,
      explanation: formExplanation.trim(),
    };

    const exists = questions.some(q => q.id === updated.id);
    if (exists) {
      onUpdateQuestions(questions.map(q => q.id === updated.id ? updated : q));
    } else {
      onUpdateQuestions([...questions, updated]);
    }

    setEditingQuestion(null);
  };

  const handleDeleteQuestion = (id: string) => {
    if (questions.length <= 1) {
      alert('Minimal harus ada 1 soal dalam game!');
      return;
    }
    if (confirm('Hapus soal ini?')) {
      onUpdateQuestions(questions.filter(q => q.id !== id));
    }
  };

  const handleResetDefault = () => {
    if (confirm('Kembalikan ke daftar soal bawaan (Bahasa Indonesia Kelas 8: 7 Soal)?')) {
      onUpdateQuestions(DEFAULT_QUESTIONS);
    }
  };

  // Download Excel Template
  const handleDownloadTemplate = () => {
    const templateData = [
      {
        Kategori: 'Iklan',
        Pertanyaan: 'Apa tujuan utama dari teks iklan komersial?',
        Pilihan_A: 'Membujuk masyarakat membeli produk',
        Pilihan_B: 'Memberikan informasi sejarah',
        Pilihan_C: 'Menceritakan dongeng masa lalu',
        Pilihan_D: 'Menyajikan data sensus penduduk',
        Kunci_Jawaban: 'A',
        Pembahasan: 'Iklan komersial bertujuan komersial untuk meningkatkan penjualan barang atau jasa.'
      },
      {
        Kategori: 'Slogan',
        Pertanyaan: 'Manakah slogan yang bertema pentingnya membaca buku?',
        Pilihan_A: 'Hemat Pangkal Kaya',
        Pilihan_B: 'Buku Jendela Dunia, Membaca Kunci Ilmu',
        Pilihan_C: 'Buang Sampah Pada Tempatnya',
        Pilihan_D: 'Ayo Sukseskan Wajib Belajar 12 Tahun',
        Kunci_Jawaban: 'B',
        Pembahasan: 'Slogan tersebut menekankan manfaat besar dari membaca buku bagi wawasan dunia.'
      },
      {
        Kategori: 'Poster',
        Pertanyaan: 'Poster yang ditempel di mading sekolah untuk mempromosikan pentas seni siswa disebut...',
        Pilihan_A: 'Poster Niaga',
        Pilihan_B: 'Poster Layanan Masyarakat',
        Pilihan_C: 'Poster Kegiatan',
        Pilihan_D: 'Poster Riset',
        Kunci_Jawaban: 'C',
        Pembahasan: 'Poster kegiatan bertujuan memberi informasi terkait acara/kegiatan yang akan berlangsung.'
      }
    ];

    const worksheet = XLSX.utils.json_to_sheet(templateData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Template_Soal');
    XLSX.writeFile(workbook, 'Template_Soal_Bahasa_Indonesia_Kelas_8.xlsx');
  };

  // Import Excel / CSV
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setImportStatus(null);
    setImportError(null);

    const reader = new FileReader();
    reader.onload = (evt) => {
      try {
        const bstr = evt.target?.result;
        const workbook = XLSX.read(bstr, { type: 'binary' });
        const firstSheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[firstSheetName];
        const rows = XLSX.utils.sheet_to_json<any>(worksheet);

        if (!rows || rows.length === 0) {
          setImportError('File Excel/CSV kosong atau tidak berisi data.');
          return;
        }

        const parsedQuestions: Question[] = [];
        rows.forEach((row, idx) => {
          const qText = row.Pertanyaan || row.pertanyaan || row.Question || row.question;
          const optA = row.Pilihan_A || row.pilihan_a || row.A || row.a;
          const optB = row.Pilihan_B || row.pilihan_b || row.B || row.b;
          const optC = row.Pilihan_C || row.pilihan_c || row.C || row.c || '-';
          const optD = row.Pilihan_D || row.pilihan_d || row.D || row.d || '-';
          let correct = (row.Kunci_Jawaban || row.kunci_jawaban || row.Kunci || row.Answer || 'A').toString().trim().toUpperCase();
          if (!['A', 'B', 'C', 'D'].includes(correct)) correct = 'A';

          const catRaw = (row.Kategori || row.kategori || 'Iklan').toString().trim();
          const category: 'Iklan' | 'Slogan' | 'Poster' | 'Umum' = 
            catRaw.toLowerCase().includes('slogan') ? 'Slogan' :
            catRaw.toLowerCase().includes('poster') ? 'Poster' :
            catRaw.toLowerCase().includes('iklan') ? 'Iklan' : 'Umum';

          const explanation = row.Pembahasan || row.pembahasan || row.Explanation || 'Pembahasan materi Bahasa Indonesia.';

          if (qText && optA && optB) {
            parsedQuestions.push({
              id: 'imported_' + Date.now() + '_' + idx,
              category,
              question: String(qText),
              options: [
                { key: 'A', text: String(optA) },
                { key: 'B', text: String(optB) },
                { key: 'C', text: String(optC) },
                { key: 'D', text: String(optD) },
              ],
              correctAnswer: correct as 'A' | 'B' | 'C' | 'D',
              explanation: String(explanation),
            });
          }
        });

        if (parsedQuestions.length === 0) {
          setImportError('Tidak ditemukan format soal yang valid. Pastikan kolom: Pertanyaan, Pilihan_A, Pilihan_B, Kunci_Jawaban.');
          return;
        }

        onUpdateQuestions(parsedQuestions);
        setImportStatus(`Berhasil mengimpor ${parsedQuestions.length} soal ke bank soal game!`);
      } catch (err: any) {
        setImportError('Gagal membaca file: ' + (err.message || 'Format tidak didukung'));
      }
    };
    reader.readAsBinaryString(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md animate-fadeIn">
      <div className="relative w-full max-w-4xl max-h-[92vh] flex flex-col bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl text-white overflow-hidden">
        
        {/* Top Header */}
        <div className="p-6 border-b border-slate-800 flex items-center justify-between bg-slate-900/90">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-500/10 border border-indigo-500/30 rounded-2xl text-indigo-400">
              <Settings className="w-6 h-6" />
            </div>
            <div>
              <span className="text-xs uppercase tracking-widest font-bold text-indigo-400">PENGATURAN & BANK SOAL</span>
              <h2 className="text-2xl font-extrabold font-['Rajdhani',sans-serif] tracking-wide">
                MANAJEMEN PERMAINAN
              </h2>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
          >
            ✕
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-2 px-6 pt-4 border-b border-slate-800 bg-slate-900/50">
          <button
            onClick={() => { setActiveTab('bank'); setEditingQuestion(null); }}
            className={`px-4 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'bank'
                ? 'border-indigo-400 text-indigo-300 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <FileSpreadsheet className="w-4 h-4" />
            Bank Soal ({questions.length})
          </button>
          <button
            onClick={() => setActiveTab('import')}
            className={`px-4 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'import'
                ? 'border-indigo-400 text-indigo-300 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Upload className="w-4 h-4" />
            Impor Excel / CSV
          </button>
          <button
            onClick={() => setActiveTab('settings')}
            className={`px-4 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'settings'
                ? 'border-indigo-400 text-indigo-300 bg-slate-800/80'
                : 'border-transparent text-slate-400 hover:text-slate-200'
            }`}
          >
            <Sliders className="w-4 h-4" />
            Pengaturan Game (Timer & Skor)
          </button>
        </div>

        {/* Tab Content Body */}
        <div className="flex-1 overflow-y-auto p-6">
          
          {/* TAB 1: BANK SOAL */}
          {activeTab === 'bank' && !editingQuestion && (
            <div className="space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div className="text-sm text-slate-300">
                  Total <strong className="text-white">{questions.length} Soal</strong> aktif untuk materi Teks Iklan, Slogan, dan Poster (Kelas 8 SMP).
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleResetDefault}
                    className="px-3 py-1.5 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 border border-slate-700 flex items-center gap-1.5 transition-colors"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    Reset Bawaan (7 Soal)
                  </button>
                  <button
                    onClick={handleStartCreate}
                    className="px-4 py-2 text-xs font-bold rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-1.5 shadow-md shadow-indigo-600/20 transition-all"
                  >
                    <Plus className="w-4 h-4" />
                    Tambah Soal Baru
                  </button>
                </div>
              </div>

              {/* Questions List */}
              <div className="space-y-3 mt-3">
                {questions.map((q, idx) => (
                  <div
                    key={q.id}
                    className="p-4 rounded-2xl bg-slate-800/60 border border-slate-700/60 hover:border-slate-600 transition-all"
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex items-center gap-2">
                          <span className="w-6 h-6 rounded-lg bg-indigo-500/20 text-indigo-300 font-bold text-xs flex items-center justify-center border border-indigo-500/30">
                            {idx + 1}
                          </span>
                          <span className={`text-[11px] font-bold px-2 py-0.5 rounded-full ${
                            q.category === 'Iklan' ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30' :
                            q.category === 'Slogan' ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30' :
                            q.category === 'Poster' ? 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/30' :
                            'bg-purple-500/20 text-purple-300 border border-purple-500/30'
                          }`}>
                            {q.category}
                          </span>
                        </div>
                        <p className="font-semibold text-white text-sm md:text-base leading-snug">
                          {q.question}
                        </p>
                        
                        {/* Options preview */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-2 pt-2 border-t border-slate-700/40 text-xs">
                          {q.options.map((opt) => (
                            <div
                              key={opt.key}
                              className={`p-2 rounded-lg ${
                                opt.key === q.correctAnswer
                                  ? 'bg-emerald-950/40 text-emerald-300 border border-emerald-500/30 font-semibold'
                                  : 'bg-slate-900/60 text-slate-300'
                              }`}
                            >
                              <span className="font-bold mr-1.5">{opt.key}.</span> {opt.text}
                              {opt.key === q.correctAnswer && ' ✓ (Kunci)'}
                            </div>
                          ))}
                        </div>

                        {q.explanation && (
                          <div className="text-xs text-slate-400 mt-1 italic">
                            💡 Pembahasan: {q.explanation}
                          </div>
                        )}
                      </div>

                      {/* Action buttons */}
                      <div className="flex items-center gap-1.5 shrink-0 ml-2">
                        <button
                          onClick={() => handleStartEdit(q)}
                          className="p-2 rounded-xl bg-slate-700 hover:bg-slate-600 text-slate-200 transition-colors"
                          title="Edit Soal"
                        >
                          <Edit3 className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => handleDeleteQuestion(q.id)}
                          className="p-2 rounded-xl bg-rose-500/20 hover:bg-rose-500/30 text-rose-300 border border-rose-500/30 transition-colors"
                          title="Hapus Soal"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* TAB 1: FORM EDIT / CREATE QUESTION */}
          {activeTab === 'bank' && editingQuestion && (
            <div className="space-y-4 max-w-2xl mx-auto bg-slate-800/40 p-5 rounded-2xl border border-slate-700">
              <div className="flex items-center justify-between pb-3 border-b border-slate-700">
                <h3 className="font-bold text-lg text-white">
                  {questions.some(q => q.id === editingQuestion.id) ? 'Edit Soal' : 'Tambah Soal Baru'}
                </h3>
                <button
                  onClick={() => setEditingQuestion(null)}
                  className="text-xs font-semibold px-3 py-1 rounded-lg bg-slate-700 hover:bg-slate-600 text-slate-300"
                >
                  Batal
                </button>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Kategori Materi</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['Iklan', 'Slogan', 'Poster', 'Umum'] as const).map(cat => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setFormCategory(cat)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        formCategory === cat
                          ? 'bg-indigo-600 border-indigo-400 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Teks Pertanyaan</label>
                <textarea
                  value={formText}
                  onChange={(e) => setFormText(e.target.value)}
                  placeholder="Contoh: Kalimat 'Gunakan listrik seperlunya demi masa depan bumi!' termasuk..."
                  rows={3}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Pilihan A</label>
                  <input
                    type="text"
                    value={formOptA}
                    onChange={(e) => setFormOptA(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Jawaban opsi A"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Pilihan B</label>
                  <input
                    type="text"
                    value={formOptB}
                    onChange={(e) => setFormOptB(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Jawaban opsi B"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Pilihan C</label>
                  <input
                    type="text"
                    value={formOptC}
                    onChange={(e) => setFormOptC(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Jawaban opsi C"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Pilihan D</label>
                  <input
                    type="text"
                    value={formOptD}
                    onChange={(e) => setFormOptD(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                    placeholder="Jawaban opsi D"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Kunci Jawaban Benar</label>
                <div className="grid grid-cols-4 gap-2">
                  {(['A', 'B', 'C', 'D'] as const).map(k => (
                    <button
                      key={k}
                      type="button"
                      onClick={() => setFormCorrect(k)}
                      className={`py-2 px-3 text-xs font-bold rounded-xl border transition-all ${
                        formCorrect === k
                          ? 'bg-emerald-600 border-emerald-400 text-white'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      Kunci: {k}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold uppercase text-slate-400 mb-1">Penjelasan / Pembahasan Materi</label>
                <textarea
                  value={formExplanation}
                  onChange={(e) => setFormExplanation(e.target.value)}
                  placeholder="Penjelasan edukatif agar siswa paham mengapa jawaban tersebut tepat..."
                  rows={2}
                  className="w-full px-3.5 py-2.5 rounded-xl bg-slate-900 border border-slate-700 text-white text-sm focus:border-indigo-500 focus:outline-none"
                />
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setEditingQuestion(null)}
                  className="px-5 py-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold"
                >
                  Batal
                </button>
                <button
                  type="button"
                  onClick={handleSaveQuestion}
                  className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-bold shadow-lg shadow-indigo-600/30"
                >
                  Simpan Soal
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: IMPORT EXCEL / CSV */}
          {activeTab === 'import' && (
            <div className="max-w-2xl mx-auto space-y-6">
              <div className="p-5 rounded-2xl bg-indigo-950/30 border border-indigo-500/30 space-y-3">
                <div className="flex items-center gap-2 text-indigo-300 font-bold">
                  <Download className="w-5 h-5" />
                  Langkah 1: Unduh Template Excel / Spreadsheet
                </div>
                <p className="text-sm text-slate-300 leading-relaxed">
                  Gunakan format template resmi agar data soal dapat dibaca otomatis. File template sudah memiliki kolom:
                  <code className="text-xs bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 ml-1">Kategori</code>,
                  <code className="text-xs bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 ml-1">Pertanyaan</code>,
                  <code className="text-xs bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 ml-1">Pilihan_A/B/C/D</code>,
                  <code className="text-xs bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 ml-1">Kunci_Jawaban</code>,
                  <code className="text-xs bg-slate-900 px-1.5 py-0.5 rounded text-indigo-300 ml-1">Pembahasan</code>.
                </p>
                <button
                  onClick={handleDownloadTemplate}
                  className="px-5 py-2.5 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white text-xs font-bold flex items-center gap-2 shadow-lg shadow-emerald-600/20"
                >
                  <Download className="w-4 h-4" />
                  Download Template Excel (.xlsx)
                </button>
              </div>

              {/* Upload box */}
              <div className="p-6 rounded-2xl bg-slate-800/40 border border-slate-700 text-center space-y-4">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-slate-800 border border-slate-700 flex items-center justify-center text-indigo-400">
                  <Upload className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="font-bold text-base text-white">Langkah 2: Unggah File Soal (.xlsx, .xls, .csv)</h4>
                  <p className="text-xs text-slate-400 mt-1">Pilih file Excel dari komputer Anda untuk dimasukkan langsung ke permainan.</p>
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".xlsx, .xls, .csv"
                  onChange={handleFileUpload}
                  className="hidden"
                  id="excelFileInput"
                />

                <label
                  htmlFor="excelFileInput"
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm cursor-pointer shadow-lg shadow-indigo-600/20 transition-all hover:scale-105"
                >
                  <FileSpreadsheet className="w-4 h-4" />
                  Pilih File Excel / CSV
                </label>

                {importStatus && (
                  <div className="p-3 rounded-xl bg-emerald-950/60 border border-emerald-500/40 text-emerald-300 text-xs font-semibold flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" />
                    {importStatus}
                  </div>
                )}

                {importError && (
                  <div className="p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 text-rose-300 text-xs font-semibold flex items-center justify-center gap-2">
                    <AlertCircle className="w-4 h-4" />
                    {importError}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 3: SETTINGS (TIMER & SKOR) */}
          {activeTab === 'settings' && (
            <div className="max-w-xl mx-auto space-y-6 bg-slate-800/40 p-6 rounded-2xl border border-slate-700">
              
              {/* Timer */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-white flex items-center gap-2">
                    <Clock className="w-4 h-4 text-cyan-400" />
                    Waktu / Timer per Soal
                  </label>
                  <span className="text-sm font-extrabold text-cyan-400 font-mono">
                    {settings.secondsPerQuestion} Detik
                  </span>
                </div>
                <input
                  type="range"
                  min="10"
                  max="60"
                  step="5"
                  value={settings.secondsPerQuestion}
                  onChange={(e) => onUpdateSettings({ ...settings, secondsPerQuestion: Number(e.target.value) })}
                  className="w-full accent-cyan-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>10s (Cepat)</span>
                  <span>20s (Standar)</span>
                  <span>60s (Santai)</span>
                </div>
              </div>

              {/* Points per correct */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-white flex items-center gap-2">
                    <Trophy className="w-4 h-4 text-amber-400" />
                    Skor Jawaban Benar
                  </label>
                  <span className="text-sm font-extrabold text-amber-400 font-mono">
                    +{settings.pointsPerCorrect} Poin
                  </span>
                </div>
                <input
                  type="range"
                  min="50"
                  max="250"
                  step="25"
                  value={settings.pointsPerCorrect}
                  onChange={(e) => onUpdateSettings({ ...settings, pointsPerCorrect: Number(e.target.value) })}
                  className="w-full accent-amber-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Penalty wrong */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-white flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-rose-400" />
                    Penalti Jawaban Salah
                  </label>
                  <span className="text-sm font-extrabold text-rose-400 font-mono">
                    -{settings.penaltyWrong} Poin
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max="100"
                  step="10"
                  value={settings.penaltyWrong}
                  onChange={(e) => onUpdateSettings({ ...settings, penaltyWrong: Number(e.target.value) })}
                  className="w-full accent-rose-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />
              </div>

              {/* Max Lives */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-white flex items-center gap-2">
                    <Heart className="w-4 h-4 text-rose-500 fill-rose-500" />
                    Jumlah Nyawa Awal (Hati)
                  </label>
                  <span className="text-sm font-extrabold text-rose-400 font-mono">
                    {settings.maxLives} Nyawa
                  </span>
                </div>
                <div className="flex gap-2">
                  {[1, 2, 3, 5].map((lives) => (
                    <button
                      key={lives}
                      type="button"
                      onClick={() => onUpdateSettings({ ...settings, maxLives: lives })}
                      className={`flex-1 py-2 rounded-xl text-xs font-bold border transition-all ${
                        settings.maxLives === lives
                          ? 'bg-rose-600 border-rose-400 text-white shadow-md shadow-rose-600/30'
                          : 'bg-slate-800 border-slate-700 text-slate-400 hover:text-white'
                      }`}
                    >
                      {lives} ❤️
                    </button>
                  ))}
                </div>
              </div>

              {/* Camera Background Opacity / Clarity */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-sm font-bold text-white">Kejernihan Latar Belakang Kamera Webcam</label>
                  <span className="text-xs text-cyan-300 font-bold font-mono">{Math.round(settings.bgOpacity * 100)}% (Jelas & Bening)</span>
                </div>
                <input
                  type="range"
                  min="0.3"
                  max="1"
                  step="0.05"
                  value={settings.bgOpacity}
                  onChange={(e) => onUpdateSettings({ ...settings, bgOpacity: Number(e.target.value) })}
                  className="w-full accent-cyan-500 h-2 bg-slate-700 rounded-lg cursor-pointer"
                />
                <div className="flex justify-between text-[10px] text-slate-400 mt-1 font-mono">
                  <span>Transparan Tipis (30%)</span>
                  <span>Standar Bening (95%)</span>
                  <span>100% (Sangat Jelas)</span>
                </div>
              </div>

            </div>
          )}

        </div>

        {/* Footer */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/90 flex items-center justify-end">
          <button
            onClick={onClose}
            className="px-6 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold text-sm shadow-md shadow-indigo-600/30 transition-all cursor-pointer"
          >
            Terapkan & Selesai
          </button>
        </div>

      </div>
    </div>
  );
};
