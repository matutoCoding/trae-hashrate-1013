import { useState } from 'react';
import { Users, Plus, Pencil, Trash2, X, User, Search, Scale, Ruler } from 'lucide-react';
import PageHeader from '@/components/PageHeader';
import { useAppStore } from '@/store';
import type { Actor } from '@/types';

const emptyForm: Omit<Actor, 'id' | 'createdAt'> = {
  name: '',
  code: '',
  gender: 'male',
  age: 25,
  heightCm: 170,
  weightKg: 65,
  maxLoadKg: 100,
  shoulderWidthCm: 42,
  notes: '',
};

export default function Actors() {
  const { actors, addActor, updateActor, deleteActor } = useAppStore();
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Actor | null>(null);
  const [form, setForm] = useState(emptyForm);
  const [search, setSearch] = useState('');

  const filtered = actors.filter(
    (a) =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase()),
  );

  const openNew = () => {
    setEditing(null);
    setForm(emptyForm);
    setShowModal(true);
  };

  const openEdit = (a: Actor) => {
    setEditing(a);
    setForm({
      name: a.name,
      code: a.code,
      gender: a.gender,
      age: a.age,
      heightCm: a.heightCm,
      weightKg: a.weightKg,
      maxLoadKg: a.maxLoadKg,
      shoulderWidthCm: a.shoulderWidthCm,
      notes: a.notes ?? '',
    });
    setShowModal(true);
  };

  const submit = () => {
    if (!form.name.trim() || !form.code.trim()) return;
    if (editing) updateActor(editing.id, form);
    else addActor(form);
    setShowModal(false);
  };

  return (
    <div className="p-8">
      <PageHeader
        title="演员录入"
        subtitle="管理参演人员的身体参数与承重能力档案"
        icon={<Users className="w-6 h-6 text-safety-gold" />}
        actions={
          <button onClick={openNew} className="btn-gold flex items-center gap-2">
            <Plus className="w-4 h-4" />
            <span>新增演员</span>
          </button>
        }
      />

      <div className="mb-4 max-w-sm">
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-navy-400" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索姓名或编号..."
            className="input-field pl-10"
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
        {filtered.map((actor) => (
          <div key={actor.id} className="glass-card rounded-xl p-5 hover:border-safety-gold/30 transition-colors group">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl flex items-center justify-center"
                     style={{ background: actor.gender === 'female'
                       ? 'linear-gradient(135deg, #87a2c8, #5579ab)'
                       : 'linear-gradient(135deg, #355a90, #264775)' }}>
                  <User className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="font-semibold text-navy-50">{actor.name}</div>
                  <div className="text-xs text-navy-300">{actor.code} · {actor.gender === 'male' ? '男' : '女'} · {actor.age}岁</div>
                </div>
              </div>
              <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => openEdit(actor)} className="p-1.5 rounded-lg hover:bg-navy-700/50 text-navy-300 hover:text-safety-gold transition-colors">
                  <Pencil className="w-4 h-4" />
                </button>
                <button onClick={() => deleteActor(actor.id)} className="p-1.5 rounded-lg hover:bg-navy-700/50 text-navy-300 hover:text-safety-red transition-colors">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-navy-900/40 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-navy-400 text-xs mb-1">
                  <Ruler className="w-3.5 h-3.5" />
                  <span>身高</span>
                </div>
                <div className="text-navy-50 font-semibold">{actor.heightCm} <span className="text-xs text-navy-400 font-normal">cm</span></div>
              </div>
              <div className="bg-navy-900/40 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-navy-400 text-xs mb-1">
                  <Scale className="w-3.5 h-3.5" />
                  <span>体重</span>
                </div>
                <div className="text-navy-50 font-semibold">{actor.weightKg} <span className="text-xs text-navy-400 font-normal">kg</span></div>
              </div>
              <div className="bg-navy-900/40 rounded-lg p-2.5">
                <div className="flex items-center gap-1.5 text-safety-gold text-xs mb-1">
                  <Scale className="w-3.5 h-3.5" />
                  <span>承重上限</span>
                </div>
                <div className="text-safety-gold font-semibold">{actor.maxLoadKg} <span className="text-xs text-navy-400 font-normal">kg</span></div>
              </div>
            </div>
            {actor.notes && (
              <div className="mt-3 text-xs text-navy-400 bg-navy-900/30 rounded-lg p-2">
                {actor.notes}
              </div>
            )}
          </div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="glass-card rounded-xl p-16 text-center">
          <Users className="w-16 h-16 mx-auto text-navy-600 mb-4" />
          <p className="text-navy-300 mb-4">暂无演员数据</p>
          <button onClick={openNew} className="btn-gold">点击新增演员</button>
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="glass-card rounded-2xl p-6 w-full max-w-2xl">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-display text-xl text-navy-50">{editing ? '编辑演员' : '新增演员'}</h3>
              <button onClick={() => setShowModal(false)} className="p-2 rounded-lg hover:bg-navy-700/50 text-navy-300">
                <X className="w-5 h-5" />
              </button>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label">姓名 *</label>
                <input className="input-field" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
              </div>
              <div>
                <label className="label">编号 *</label>
                <input className="input-field" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} />
              </div>
              <div>
                <label className="label">性别</label>
                <select className="input-field" value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value as Actor['gender'] })}>
                  <option value="male">男</option>
                  <option value="female">女</option>
                </select>
              </div>
              <div>
                <label className="label">年龄</label>
                <input type="number" className="input-field" value={form.age} onChange={(e) => setForm({ ...form, age: +e.target.value })} />
              </div>
              <div>
                <label className="label">身高 (cm)</label>
                <input type="number" className="input-field" value={form.heightCm} onChange={(e) => setForm({ ...form, heightCm: +e.target.value })} />
              </div>
              <div>
                <label className="label">体重 (kg)</label>
                <input type="number" step="0.1" className="input-field" value={form.weightKg} onChange={(e) => setForm({ ...form, weightKg: +e.target.value })} />
              </div>
              <div>
                <label className="label">最大承重 (kg)</label>
                <input type="number" className="input-field" value={form.maxLoadKg} onChange={(e) => setForm({ ...form, maxLoadKg: +e.target.value })} />
              </div>
              <div>
                <label className="label">肩宽 (cm)</label>
                <input type="number" className="input-field" value={form.shoulderWidthCm} onChange={(e) => setForm({ ...form, shoulderWidthCm: +e.target.value })} />
              </div>
              <div className="col-span-2">
                <label className="label">备注</label>
                <textarea className="input-field h-20 resize-none" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
              </div>
            </div>
            <div className="flex gap-3 justify-end mt-6">
              <button onClick={() => setShowModal(false)} className="btn-ghost">取消</button>
              <button onClick={submit} className="btn-gold">{editing ? '保存修改' : '添加演员'}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
