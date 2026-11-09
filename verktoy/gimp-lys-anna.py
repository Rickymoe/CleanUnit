"""GIMP-skript (Python-Fu): lysjusterer Annas bilde til Om oss for Stavanger (Ricky valgte variant C 2026-11-09, «ser bedre ut»).

Annas original er tatt mot et lyst glasstak, så ansiktet ligger i skygge. Steg: (1) skygger +60 og høylys -40 på hele bildet,
(2) i en myk sirkel rundt ansiktet: +0,7 blenderåpninger eksponering og skygger +50. Ansiktet blir ca. 23 av 255 lysere, taket ca. 11 mørkere.
Resultatet lagres ved siden av originalen som «Anna bilde netsiden (lys).jpg» (utenfor repoet) og brukes av verktoy/portretter.py.

Kjøres av portretter.py, eller for hånd (bruk /usr/bin/gimp, ikke snap-versjonen som henger uten grensesnitt):
  /usr/bin/gimp -i --quit --batch-interpreter=python-fu-eval -b "exec(open('verktoy/gimp-lys-anna.py').read())"
Kjør fra repo-roten med full sti om GIMP ikke finner filen."""
import os
import gi
gi.require_version('Gimp', '3.0')
from gi.repository import Gimp, Gio

MAPPE = os.path.expanduser('~/Dokumenter/Koding/CleanUnit.Dokumenter/Stavanger/09.11.2026.bilder/')
KILDE, UT = 'Anna bilde netsiden.jpeg', 'Anna bilde netsiden (lys).jpg'
ANSIKT = (470, 250, 330, 430)       # x, y, bredde, høyde i originalens piksler (960 × 1280)


def filter_pa(lag, operasjon, **param):
    f = Gimp.DrawableFilter.new(lag, operasjon, operasjon)
    for navn, verdi in param.items():
        f.get_config().set_property(navn, verdi)
    lag.append_filter(f)
    lag.merge_filter(f)


img = Gimp.file_load(Gimp.RunMode.NONINTERACTIVE, Gio.File.new_for_path(MAPPE + KILDE))
lag = img.get_layers()[0]
filter_pa(lag, 'gegl:shadows-highlights', shadows=60.0, highlights=-40.0)
img.select_ellipse(Gimp.ChannelOps.REPLACE, *ANSIKT)
Gimp.Selection.feather(img, 90.0)
filter_pa(lag, 'gegl:exposure', exposure=0.7)
filter_pa(lag, 'gegl:shadows-highlights', shadows=50.0, highlights=0.0)
Gimp.Selection.none(img)
Gimp.file_save(Gimp.RunMode.NONINTERACTIVE, img, Gio.File.new_for_path(MAPPE + UT), None)
print('GIMP lagret', UT, flush=True)
