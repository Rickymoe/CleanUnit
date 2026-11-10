"""GIMP-skript (Python-Fu): lysjusterer Thoras bilde til Om oss for Stavanger (Marit 10.11.2026; Ricky valgte variant B 2026-11-10).

Originalen (Thora bilde1.jpeg) er mørk og grå, tatt med et webkamera med innbrent dato nederst til venstre (faller utenfor utsnittet).
Steg: skygger +70 og høylys -30, deretter +0,5 blenderåpninger eksponering og metning ×1,6. Ansiktet blir ca. 24 av 255 lysere (143 → 167).
Resultatet lagres ved siden av originalen som «Thora bilde1 (lys).jpg» (utenfor repoet) og brukes av verktoy/portretter.py.

Kjøres av portretter.py, eller for hånd (bruk /usr/bin/gimp, ikke snap-versjonen som henger uten grensesnitt):
  /usr/bin/gimp -i --quit --batch-interpreter=python-fu-eval -b "exec(open('/full/sti/til/verktoy/gimp-lys-thora.py').read())\""""
import os
import gi
gi.require_version('Gimp', '3.0')
from gi.repository import Gimp, Gio

MAPPE = os.path.expanduser('~/Dokumenter/Koding/CleanUnit.Dokumenter/Stavanger/10.11.2026.bilder/')
KILDE, UT = 'Thora bilde1.jpeg', 'Thora bilde1 (lys).jpg'


def filter_pa(lag, operasjon, **param):
    f = Gimp.DrawableFilter.new(lag, operasjon, operasjon)
    for navn, verdi in param.items():
        f.get_config().set_property(navn, verdi)
    lag.append_filter(f)
    lag.merge_filter(f)


img = Gimp.file_load(Gimp.RunMode.NONINTERACTIVE, Gio.File.new_for_path(MAPPE + KILDE))
lag = img.get_layers()[0]
filter_pa(lag, 'gegl:shadows-highlights', shadows=70.0, highlights=-30.0)
filter_pa(lag, 'gegl:exposure', exposure=0.5)
filter_pa(lag, 'gegl:saturation', scale=1.6)
Gimp.file_save(Gimp.RunMode.NONINTERACTIVE, img, Gio.File.new_for_path(MAPPE + UT), None)
print('GIMP lagret', UT, flush=True)
