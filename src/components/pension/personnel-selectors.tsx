import * as React from 'react';
import { API_BASE_URL, getAuthHeaders } from '@/lib/api';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Command, CommandEmpty, CommandGroup, CommandItem, CommandList } from '@/components/ui/command';
import { User as UserIcon } from 'lucide-react';

export type Personnel = {
  id: string;
  name: string;
  nip: string;
  position?: string;
  unit?: string;
  rank?: string;
};

export type RoleType = 'pejabat' | 'pegawai';

// remove mock; always hit backend search

export function usePersonnelSearch(params: { role: RoleType; nip?: string; name?: string }) {
  const { role, nip = '', name = '' } = params;
  const [loading, setLoading] = React.useState(false);
  const [data, setData] = React.useState<Personnel[]>([]);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const controller = new AbortController();
    const qNip = nip.trim();
    const qName = name.trim();
    if (!qNip && !qName) {
      setData([]);
      setError(null);
      return;
    }
    setLoading(true);
    setError(null);
    const t = setTimeout(async () => {
      try {
        const url = new URL(`${API_BASE_URL || ''}/api/personnel/search`);
        const q = (qName || qNip).trim();
        if (!q || q.length < 2) { setData([]); setLoading(false); return; }
        url.searchParams.set('q', q);
        url.searchParams.set('limit', '20');

        const res = await fetch(url.toString(), { credentials: 'include', headers: { ...getAuthHeaders() }, signal: controller.signal });
        const json = await res.json();
        const items = (json?.data || []).map((p: any) => ({
          id: String(p.id ?? p.nip ?? Math.random()),
          name: p.nama ?? p.name ?? '',
          nip: p.nip ?? '',
          position: p.jabatan ?? p.position,
          unit: p.unit_kerja ?? p.unit,
          rank: p.golongan ?? p.rank,
        })) as Personnel[];
        setData(items);
      } catch (e: any) {
        if (e?.name !== 'AbortError') {
          setData([]);
          setError(e?.message || 'Gagal mencari data');
        }
      } finally {
        setLoading(false);
      }
    }, 300);

    return () => {
      clearTimeout(t);
      controller.abort();
    };
  }, [API_BASE_URL, role, nip, name]);

  return { loading, data, error };
}

export type PersonnelSelectorProps = {
  role: RoleType;
  value?: Personnel | null;
  onChange: (val: Personnel | null) => void;
  placeholder?: string;
  searchLabel?: string;
};

export const PersonnelSelector: React.FC<PersonnelSelectorProps> = ({
  role,
  value,
  onChange,
  placeholder = 'Ketik NIP atau Nama',
}) => {
  const [query, setQuery] = React.useState('');
  const { data, loading, error } = usePersonnelSearch({ role, nip: query, name: query });

  const handleSelect = (item: Personnel) => {
    onChange(item);
    setQuery('');
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="relative">
        <Input
          placeholder={value ? `${value.name} — ${(value.nip || '').replace(/\D+/g, '')}` : placeholder}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        {query && (
          <div className="absolute z-50 mt-1 w-full rounded-md border bg-popover text-popover-foreground shadow max-h-72 overflow-auto">
            <Command>
              <CommandList>
                {loading && <div className="p-3 text-sm text-muted-foreground">Memuat…</div>}
                {error && !loading && <div className="p-3 text-sm text-red-600">{error}</div>}
                {!loading && !error && (
                  <>
                    <CommandEmpty>Tidak ada hasil</CommandEmpty>
                    <CommandGroup>
                      {data.map((item) => (
                        <CommandItem
                          key={item.id}
                          value={`${item.name} ${item.nip}`}
                          onMouseDown={(e) => { e.preventDefault(); handleSelect(item); }}
                          onSelect={() => handleSelect(item)}
                        >
                          <div className="flex items-start gap-3 w-full">
                            <div className="h-9 w-9 rounded-md bg-muted flex items-center justify-center">
                              <UserIcon className="h-5 w-5 text-muted-foreground" />
                            </div>
                            <div className="flex-1">
                              <div className="font-semibold leading-tight">{item.name}</div>
                              <div className="text-xs text-muted-foreground">{(item.nip || '').replace(/\D+/g, '')}</div>
                              {(item.position || item.unit) && (
                                <div className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                  {item.position ? `${item.position}` : ''}{item.position && item.unit ? ' — ' : ''}{item.unit ? `${item.unit}` : ''}
                                </div>
                              )}
                            </div>
                          </div>
                        </CommandItem>
                      ))}
                    </CommandGroup>
                  </>
                )}
              </CommandList>
            </Command>
          </div>
        )}
      </div>

      {value && (
        <div className="text-xs text-muted-foreground">
          Terpilih: {value.name} — NIP {(value.nip || '').replace(/\D+/g, '')}{value.position ? ` • ${value.position}` : ''}{value.unit ? ` • ${value.unit}` : ''}
          <Button variant="ghost" className="ml-2 h-6 px-2" onClick={() => onChange(null)}>
            Hapus
          </Button>
        </div>
      )}
    </div>
  );
};

export const PejabatSelector: React.FC<Omit<PersonnelSelectorProps, 'role'>> = (props) => {
  return <PersonnelSelector role="pejabat" {...props} />;
};

export const PegawaiSelector: React.FC<Omit<PersonnelSelectorProps, 'role'>> = (props) => {
  return <PersonnelSelector role="pegawai" {...props} />;
};


