from django.core.mail import EmailMultiAlternatives, send_mail
from django.conf import settings
from collections import defaultdict
from math import sqrt
from api.models import Variable_Plataform
from api.controllers.system_log import register_log
import datetime
import traceback
import googlemaps
import json
import qrcode
import requests
import sys

group_view_keys= {
    "admin/permit/": "Administración de Roles",
    "admin/role/": "Administración de Roles",
    "admin/parameter/": "Administración de Roles",
    "answer/": "Administración de Respuestas Formularios",
    "device/": "Administración de Dispositivos",
    "device_type/": "Administración de Categorias de Dispositivos",
    "form/": "Administración de Formularios",
    "associate/": "Administración de Formularios",
    "user/": "Administración de Usuarios",
    "enroll/": "Administración de Enrolamiento",
    "route/": "Administración de Ruta",
    "project/": "Administración de Proyectos",
    "location/": "Administración de Sucursales",
    "traceability/": "Administración de Trazabilidad",
    "geoportal/": "Administración de GeoPortal",
    "dashboard/": "Administración de Estadisticas",
    "visits/": "Administración de Visitas",
    "contacts/": "Administración de Contactos",
}


class AddressNormalizer():

    options_all = [
        # Normalizacion de Autopista
        {
            "new_text": "AUT.",
            "options": ["AUTOPISTA", "AUTO.", "AUTOP.", "AUTOP","AUT","AU.","AUT.","HAUTOPISTA","AUTOPIS","AUTOPIST","AUTOPIS.","AUTOPIST."]
        },
        # Normalizacion de Avenida
        {
            "new_text": "AV.",
            "options": ["AV", "AV.", "AVEN", "AVEN.", "HAVENIDAS", "AVENIDAS", "AB", "HAVENIDA", "AVE", "AVENIDA","AVDA","AVD.","AVD","AVCT"]
        },
        # Normalizacion de Kilometro
        {
            "new_text": "KM.",
            "options": ["KILOMETRO","KILOM","KILOMETR","KM","KM."]
        },
        # Normalizacion de Oriente
        {
            "new_text": "O.",
            "options": ["ORIENTE"]
        },
        # Normalizacion de Occidente
        {
            "new_text": "OCC.",
            "options": ["OCCIDENTE"]
        },
        # Normalizacion de Diagonal
        {
            "new_text": "DG.",
            "options": ["DG", "DIAG", "DIAG.", "DG.", "DIA.", "DIA", "DIAGO", "DIAGO.", "DIG", "DIAGO#AL", "DIAGO#AL", "DIGONAL", "DIAGONALONAL", "DIAGONAL"],
            "replace": ["DIAGO#AL", "DIAGONAL"],
            "replace_text": "DG."
        },
        # Normalizacion de Transversal
        {
            "new_text": "TV.",
            "options": ["TR", "TRA", "TRANS", "TRANSV", "TRANSVE", "TRANSVER", "TRANSVERS", "TRANSVERS.", "TRANSVERSALANSVERSAL", "TRV", "TV", "TV.", "TRV.", "TRANSV.", "TRANVERSAL", "TRA#SVERSAL", "TRANS.", "TR.", "TRA.", "TRANSV.", "TRANSVER.", "TRANSVESAL.", "TRANSVESAL", "TRA#SVERSAL", "TRANSVERSA", "TRASVERSAL", "TRANSVERSAL", "TRAV"],
            "replace": ["TRA#SVERSAL"],
            "replace_text": "TV."},
        # Normalizacion de Numero
        {
            "new_text": "#",
            "options": ["NO", "NUM", "NO.", "NUME", "NUMERO", "#°", "NUM.", "NAO", "NRO", "NRO.", "NAAºMERO", "No", "NAA°", "NAA", "NA°", "AA·", "Aª", "NAAOMERO", "NR", "NA@", "NÃ@MERO", "NA@MERO"],
            "replace": ["#", "NA@MERO", "NA@", "N@", " N "],
            "replace_text": " # "
        },
        # Normalizacion de Calle
        {
            "new_text": "CL.",
            "options": ["CLL", "CL", "KL", "KLL", "CLLE", "CALL", "CALLED", "ALLE", "CLL.", "CL.", "KL.", "KLL.", "CLLE.", "CALL.", "CALLE.", "CALLA", "CALLé", "CALLAâ©", "CALLE"],
            "replace": ["CALLE", "CLL"],
            "replace_text": "CL. "
        },
        # Normalizacion de Avenida Calle
        {
            "new_text": "AC.",
            "options": ["AC","AC.","AC@","ACLL@","ACL@","ACLL","ACL"]
        },
        # Normalizacion de Avenida Carrera
        {
            "new_text": "AK.",
            "options": ["AK","AK.","AK@","AKR", "AKR."]
        },
        # Normalizacion de Carrera
        {
            "new_text": "KR.",
            "options": ["CR", "CRA", "KRA", "KR", "CAR", "CARR", "CARRE", "CARRER", "CREA", "CARRERA", "KARRERA", "CRA.", "KRA.", "CR.", "CARA", "CARA.", "K", "CRR", "CRRA", "CRRA.", "CRR.", "CARERA", "CARRETA", "CARREARA", "CARERRA", "CARRETA", "CARRRERA"],
            "replace": ["CRA", "CRR", "CARRERA", "KRA", "KRR", "CR"],
            "replace_text": "KR.",
            "replace_2": "KR.",
            "replace_text_2": "CR.",
        },
        # Normalizacion de Circunvalar
        {
            "new_text": "CRV.",
            "options": ["CIRCUNVALAR","CIRCUNVALAR.","CIRCUNVALAR@","SIRCUNVALAR","SIRCUNVALAR.","CIRCUN","CIRCUN@","CIRC","CIRC.","CIR","CIR."]
        },
        # Normalizacion de Carretera
        {
            "new_text": "CRT.",
            "options": ["CARRETERA","CARRETE","CARRET","CARRE","CARRETER","CARRETER\@","CARRETERA\@","CARR"]
        },
    ]

    def normalize(self, address_text):

        # $Direccion = $normalizeDirection->remove_special_characters("la esquina carre 73i # 75 x 87");
        address_1 = self.remove_special_characters(address_text)
        # $Direccion2 = Str::of($Direccion)->ascii();
        # print(address_1)
        address_2 = self.remove_accent_mark(address_1['address'])
        # $Direccion = $normalizeDirection->change_text($Direccion2);
        address = self.change_text(address_2)
        # $DireccionNormalizada = $normalizeDirection->separate_text($Direccion, $Direccion2);
        normalized_address = self.separate_text(address, address_2)
        # print(normalized_address)
        # echo $DireccionNormalizada;
        # $porciones = explode("%%", $DireccionNormalizada);
        parts = normalized_address.split("%%")
        if parts[0].strip() == "":
            parts[0] = address_text
            parts.append("NO se permite")
            parts.append(0)
        if len(parts) == 1:
            parts.append("")
            parts.append(0)

        data = {
            'address': parts[0],
            'comment': parts[1],
            'review': parts[2],
        }
        return [address_1, data]

    def remove_special_characters(self, input_address):
        data = {}
        original = '".º,°'
        modified = '  @ @'
        temp = self.remove_accent_mark(input_address)
        for index, char in enumerate(original):
            temp = temp.replace(char, modified[index])
        temp = temp.upper()
        address2 = temp
        address = self.change_text(address2)
        normalized_address = self.separate_text(address, address2, flag=True)
        parts = normalized_address.split("%%")
        while len(parts)<2:
            parts.append("")

        address = self.remove_remains(self.remove_spaces(parts[0]))
        address = self.validate_last_number(address, parts[1])
        address = self.change_2(address)
        parts_2 = address.split("%%")
        if len(parts_2) > 2:
            data = {
                'address': parts_2[0],
                'comment': parts_2[1],
                'review': parts_2[2],
            }
        else:
            data = {
                'address': parts_2[0],
                'comment': parts_2[1],
                'review': 0,
            }
        return data

    def remove_accent_mark(self, text):
        replacements = (
            ("á", "a"),
            ("é", "e"),
            ("í", "i"),
            ("ó", "o"),
            ("ú", "u"),
        )
        for a, b in replacements:
            text = text.replace(a, b).replace(a.upper(), b.upper())
        return text

    def remove_spaces(self, text):
        text_parts = str(text).split(" ")
        text_parts = [part for part in text_parts if len(part) > 0]
        return " ".join(text_parts)

    def change_text(self, text):
        address_split = text.split(" ")
        address_output = text.replace(".", " ").replace("_", "-")

        for options_part in self.options_all:
            options = options_part['options']
            new_text = options_part['new_text']
            address_output = self.change_partial_text(address_split, options, new_text, address_output)

            if "replace" in options_part:
                for part_text in options_part['replace']:
                    address_output = address_output.replace(part_text, options_part['replace_text'])
            if "replace_2" in options_part:
                address_output = address_output.replace(options_part['replace_2'], options_part['replace_text_2'])

        address_output = self.change_AV_K_C(address_output)
        # print("og: ", text, "  ---> ", address_output)
        return address_output

    def change_partial_text(self, address_split, options, new_text, address_output):
        for part in address_split:
            if part in options:
                address_output = address_output.replace(part, new_text)
        return address_output

    def separate_text(self, text, text_2, flag=False):

        address = text_2.upper()
        address = address.replace(".", " ").replace("_", "-")
        ad = address
        separator = "-"
        pos = text.find(separator)
        address_output = text

        review = None
        final_text_2 = ""

        if pos != -1:
            result1 = address_output[:pos+1]
            result2 = address_output[pos+1:]
            result = result2.lstrip()[:2]
            description = result2.lstrip()[2:]
            description2 = description.lstrip()[:3]

            final_result = result1 + ' ' + result

            if description2 == 'SUR':
                result_south1 = ''
                result_south2 = ''
                address_split = final_result.split(" ")

                if address_split[0] in ['CL.', 'DG.']:
                    separator_1 = '#'
                    pos = final_result.find(separator_1)
                    if pos != -1:
                        result_south1 = final_result[:pos]
                        result_south2 = final_result[pos:]
                        final_text_2 = result_south1.rstrip() + " SUR " + result_south2.lstrip()
                elif address_split[0] in ['CR.', 'TV.']:
                    separator_1 = '-'
                    pos = final_result.find(separator_1)
                    if pos != -1:
                        result_south1 = final_result[:pos]
                        result_south2 = final_result[pos:]
                        final_text_2 = result_south1.rstrip() + " SUR" + result_south2.lstrip()
                elif address_split[0] in ['AV']:
                    separator_1 = '-'
                    pos = final_result.find(separator_1)
                    if pos != -1:
                        result_south1 = final_result[:pos]
                        result_south2 = final_result[pos:]
                        final_text_2 = result_south1.rstrip() + result_south2.lstrip() + " SUR"
            else:
                final_text_2 = final_result

            if final_text_2 == "":
                i = 0
                count = 0
                count2 = 0
                while i < len(ad):
                    count2 += 1
                    digit = ad[i]
                    if digit.isnumeric():
                        count += 1
                    if count == 1:
                        i = 100000
                    i += 1

                text_3 = ad[:count2-1]

                text_4 = ad[count2-1:]
                text_5 = text_3 + " " + text_4
                address_output = self.change(text_5)


                pos = address_output.find(separator)

                if pos != -1:
                    result1 = address_output[:pos+1]
                    result2 = address_output[pos+1:]
                    result = result2.lstrip()[:2]
                    description = result2.lstrip()[2:]
                    description2 = description.lstrip()[:3]

                    final_result = result1 + ' ' + result

                    if description2 == 'SUR':
                        result_south1 = ''
                        result_south2 = ''
                        address_split = final_result.split(" ")

                        if address_split[0] in ['CL.', 'DG.']:
                            separator_1 = '#'
                            pos = final_result.find(separator_1)
                            if pos != -1:
                                result_south1 = final_result[:pos]
                                result_south2 = final_result[pos:]
                                final_text_2 = result_south1.rstrip() + " SUR " + result_south2.lstrip()
                        elif address_split[0] in ['CR.', 'TV.']:
                            separator_1 = '-'
                            pos = final_result.find(separator_1)
                            if pos != -1:
                                result_south1 = final_result[:pos]
                                result_south2 = final_result[pos:]
                                final_text_2 = result_south1.rstrip() + " SUR" + result_south2.lstrip()
                        elif address_split[0] in ['AV.', 'AC.', 'AK.']:
                            separator_1 = '-'
                            pos = final_result.find(separator_1)
                            if pos != -1:
                                result_south1 = final_result[:pos]
                                result_south2 = final_result[pos:]
                                final_text_2 = result_south1.rstrip() + result_south2.lstrip() + " SUR"
                    else:
                        final_text_2 = final_result

                    final_text_2 = final_text_2

            last = final_text_2.rstrip()[-1] if len(final_text_2) > 0 else ""
            review = 0 if last.isnumeric() else 1

            final_text_2 = self.numeric_change(final_text_2)
            address_output = final_text_2 + "%%" + description + "%%" + str(review)
        else:

            separator = '#'
            pos1 = address_output.find(separator)

            if pos1 != -1:
                result_line1 = address_output[:pos1]
                result_line2 = address_output[pos1:]
                text = result_line2.replace(" ", "")
                text_2 = text[:7]
                description = text[7:]

                i = 0
                while i <= 2:
                    last_digit = text_2[-1]
                    if last_digit.isalpha():
                        text_2 = text_2[:-1]
                        description = last_digit + description
                    i += 1

                text_3 = text_2[-2:]
                text_4 = text_2[:-2]
                result = result_line1 + text_4 + '-' + text_3

                description2 = description.lstrip()[:3]

                if description2 == 'SUR':
                    result_south1 = ''
                    result_south2 = ''
                    address_split = result.split(" ")

                    if address_split[0] in ['CL.', 'DG.']:
                        separator_1 = '#'
                        pos = result.find(separator_1)
                        if pos != -1:
                            result_south1 = result[:pos]
                            result_south2 = result[pos:]
                            final_text_2 = result_south1.rstrip() + " SUR " + result_south2.lstrip()
                    elif address_split[0] in ['CR.', 'TV.']:
                        separator_1 = '-'
                        pos = result.find(separator_1)
                        if pos != -1:
                            result_south1 = result[:pos]
                            result_south2 = result[pos:]
                            final_text_2 = result_south1.rstrip() + " SUR" + result_south2.lstrip()
                    elif address_split[0] in ['AV']:
                        separator_1 = '-'
                        pos = result.find(separator_1)
                        if pos != -1:
                            result_south1 = result[:pos]
                            result_south2 = result[pos:]
                            final_text_2 = result_south1.rstrip() + result_south2.lstrip() + " SUR"
                else:
                    final_text_2 = result

                if final_text_2 == "":

                    i = 0
                    count = 0
                    count2 = 0
                    while i < len(ad):
                        count2 += 1
                        digit = ad[i]
                        if digit.isnumeric():
                            count += 1
                        if count == 1:
                            i = 100000
                        i += 1

                    text_3 = ad[:count2-1]

                    text_4 = ad[count2-1:]
                    text_5 = text_3 + " " + text_4
                    address_output = self.change(text_5)

                    separator = "-"
                    pos = address_output.find(separator)

                    if pos != -1:
                        result1 = address_output[:pos+1]
                        result2 = address_output[pos+1:]
                        result = result2.lstrip()[:2]
                        description = result2.lstrip()[2:]
                        description2 = description.lstrip()[:3]

                        final_result = result1 + ' ' + result

                        if description2 == 'SUR':
                            result_south1 = ''
                            result_south2 = ''
                            address_split = final_result.split(" ")

                            if address_split[0] in ['CL.', 'DG.']:
                                separator_1 = '#'
                                pos = final_result.find(separator_1)
                                if pos != -1:
                                    result_south1 = final_result[:pos]
                                    result_south2 = final_result[pos:]
                                    final_text_2 = result_south1.rstrip() + " SUR " + result_south2.lstrip()
                            elif address_split[0] in ['CR.', 'TV.']:
                                separator_1 = '-'
                                pos = final_result.find(separator_1)
                                if pos != -1:
                                    result_south1 = final_result[:pos]
                                    result_south2 = final_result[pos:]
                                    final_text_2 = result_south1.rstrip() + " SUR" + result_south2.lstrip()
                            elif address_split[0] in ['AV']:
                                separator_1 = '-'
                                pos = final_result.find(separator_1)
                                if pos != -1:
                                    result_south1 = final_result[:pos]
                                    result_south2 = final_result[pos:]
                                    final_text_2 = result_south1.rstrip() + result_south2.lstrip() + " SUR"
                        else:
                            final_text_2 = final_result

                    final_text_2 = final_text_2

                    last = final_text_2.rstrip()[-1] if len(final_text_2) > 0 else ""
                    review = 0 if last.isnumeric() else 1

                    final_text_2 = self.numeric_change(final_text_2)
                    address_output = final_text_2 + "%%" + description + "%%" + str(review)
            else:
                i = 0
                count = 0
                count2 = 0
                while i < len(ad):
                    count2 += 1
                    digit = ad[i]
                    if digit.isnumeric():
                        count += 1
                    if count == 6:
                        i = 100000
                    i += 1

                text_2 = ad
                text_3 = text_2[:count2]
                text_4 = text_2[count2:]


                last_digit = text_3.rstrip()[-1] if len(text_3) else text_2
                first_digit = text_4.lstrip()[0] if len(text_4) else text_2

                if last_digit.isnumeric() and first_digit.isalpha():

                    description2 = text_4.lstrip()[:3]
                    if description2 == 'SUR':
                        final_text_2 = text_3 + " SUR"
                        review = 1
                    else:
                        final_text_2 = text_3
                        review = 0

                    final_text_2 = self.numeric_change(final_text_2)
                    final_text_2 = self.change_text(final_text_2)
                    address_output = final_text_2 + "%%" + text_4 + "%%" + str(review)

                elif last_digit.isnumeric() and first_digit.isnumeric():

                    text_5 = text_3 + first_digit
                    description2 = text_4.lstrip()[1:4]
                    if description2 == 'SUR':
                        final_text_2 = text_5 + " SUR"
                        review = 1
                    else:
                        final_text_2 = text_5
                        review = 0

                    final_text_2 = self.numeric_change(final_text_2)
                    final_text_2 = self.change_text(final_text_2)
                    address_output = final_text_2 + "%%" + text_4 + "%%" + str(review)
                else:

                    space_count = self.count_spaces(ad)
                    # print(ad, space_count)
                    if space_count > 0:

                        i = 0
                        count = 0
                        count2 = 0

                        while i < len(ad):
                            count2 += 1
                            digit = ad[i]
                            if digit.isnumeric():
                                count += 1
                            if count == 5:
                                break
                            i += 1

                        text_2 = ad
                        text_3 = text_2[:count2]
                        text_4 = text_2[count2:]

                        description2 = text_4.lstrip()[:3]
                        if description2 == "SUR":
                            final_text_2 = text_3 + " SUR"
                            review = 1
                        else:
                            final_text_2 = text_3
                            review = 0

                        final_text_2 = self.numeric_change(final_text_2)
                        final_text_2 = self.change_text(final_text_2)
                        address_output = "{}%%{}%%{}".format(final_text_2, "" if text_4.isnumeric() else text_4, review)
                    else:
                        address_output = "NO es permitida%%0%%0"
        return address_output

    def numeric_change(self, text):
        address_output = text

        for i, char in enumerate(text):
            if char == "N":
                next = i + 1
                if next < len(text) and text[next].isnumeric():
                    address_output[i-1] = "#"
        return address_output

    def change(self, text):
        address_split = text.split(" ")
        address_output = text
        for options_part in self.options_all:
            options = options_part['options']
            new_text = options_part['new_text']
            address_output = self.change_partial_text(address_split, options, new_text, address_output)
            if "replace" in options:
                for part_text in options['replace']:
                    address_output = address_output.replace(part_text, options['replace_text'])
            if "replace_2" in options:
                address_output = address_output.replace(options['replace_2'], options['replace_text_2'])

        address_output = self.change_AV_K_C(address_output)

        return address_output

    def count_spaces(self, text):
        return len(text.split(" ")) + 1

    def remove_remains(self, text):
        options = ["AK.","AC.","AV.","CL.", "CR.","TV.","DG.","CIRCUNVALAR"]
        i = 0
        final_text = text.strip()
        while i < len(options):
            position = final_text.find(options[i])
            if position == 0:
                break
            elif position > 0:
                text_parts = final_text.split(" ")
                text_parts.remove(text_parts[0])
                final_text = " ".join(text_parts)
            else:
                i += 1
        return final_text

    def validate_last_number(self, address, description):
        address = str(address)
        if description:
            first_digit = description.lstrip()[0]
            if first_digit.isnumeric():
                address += first_digit
                description = description[1:]

        return address + "%%" + description

    def change_AV_K_C(self, address):
        address = address.replace("AV. CL. ", "AC. ")
        address = address.replace("AV. CR. ", "AK. ").replace("AV. KR. ", "AK. ")
        return address

    def change_2(self, address):
        options = ["AV.", "CR.", "CL."]
        address_split = address.split(" ")
        address_output = address
        indexes = [-1, -1, -1]

        for i, part in enumerate(address_split):
            if part in options:
                index = options.index(part)
                indexes[index] = i

        if indexes[0] == 0 and indexes[2] == 1:
            address_output.replace(options[0], "")
            address_output.replace(options[2], "AC.")
        elif indexes[0] == 0 and indexes[1] == 1:
            address_output.replace(options[0], "")
            address_output.replace(options[1], "AK.")
        else:
            address_output = address

        return address_output

gmaps = googlemaps.Client(key='AIzaSyAeNhNt9KyTgyMCPYjVxrbqQM2kFI8ZK64')

class RouteApi():

    def get_response(self, initial, final, points):
        result = gmaps.directions(
            '{},{}'.format(initial[0], initial[1]),
            '{},{}'.format(final[0], final[1]),
            waypoints=['{},{}'.format(point[0], point[1]) for point in points],
            # optimize_waypoints=True,
        )

        return result

    def distance_between_coords(self, x1, y1, x2, y2):
        distance = sqrt(((x2 - x1) ** 2) + ((y2 - y1) ** 2))
        return distance


    # Adds "names" to coordinates to use as keys for edge detection
    def name_coords(self, coords):
        coord_count = 0
        for coord in coords:
            coord_count += 1
            coord.append(coord_count)
        return coords


    # Creates a weighted and undirected graph
    # Returns named coordinates and their connected edges as a dictonary
    def graph(self, coords):
        coords = self.name_coords(coords)
        graph = defaultdict(list)
        edges = {}
        for current in coords:
            for comparer in coords:
                if comparer == current:
                    continue
                else:
                    weight = self.distance_between_coords(current[0], current[1],
                                                    comparer[0], comparer[1])
                    graph[current[2]].append(comparer[2])
                    edges[current[2], comparer[2]] = weight
        return coords, edges


    # Returns a path to all nodes with least weight as a list of names
    # from a specific node
    def shortest_path(self, node_list, edges, start):
        neighbor = 0
        unvisited = []
        visited = []
        total_weight = 0
        current_node = start
        for node in node_list:
            if node[2] == start:
                visited.append(start)
            else:
                unvisited.append(node[2])
        while unvisited:
            for index, neighbor in enumerate(unvisited):
                if index == 0:
                    current_weight = edges[start, neighbor]
                    current_node = neighbor
                elif edges[start, neighbor] < current_weight:
                    current_weight = edges[start, neighbor]
                    current_node = neighbor
            total_weight += current_weight
            unvisited.remove(current_node)
            visited.append(current_node)
        return visited, total_weight


    def driver(self, coords):
        coords, edges = self.graph(coords)
        # print(coords, edges)
        path, weight = self.shortest_path(coords, edges, 1)
        return path

def send_email(subject, content, to_email, html_template=False, img=''):
    try:
        if content != '':
            email_text(subject, content, to_email)
        else:
            email_html(subject, html_template, to_email, False, img)
        return True
    except Exception as err:
        register_log(
            {
                'action': 'Envio Correo',
                'type': 5,
                'source': 1,
                'url': 'INTERNO',
                'data': 'subject: {}, content: {}, to : {}, has template: {}'.format(subject, content, to_email, html_template),
                'response_data': 'Excepcion Capturada {} - {} - {}'.format(type(err), str(err.args), traceback.format_exception_only(type(err), err)),
            }, None)

    return False

def email_text(subject, content, to_email, html_template=False):
    from_email = settings.EMAIL_HOST_USER
    text_content = content
    html_content = html_template if html_template else text_content
    for to in to_email:
        msg = EmailMultiAlternatives(subject, text_content, from_email, [to])
        msg.attach_alternative(html_content, "text/html")
        msg.send()


def email_html(subject, content, recipient_list, public, img):
    if img != '':
        imgTitle = img
        style_background_color = '#fff'
        border_bottom = '1px solid'
    else:
        imgTitle = settings.URL_FRONTEND + 'assets/images/landing/logo_melmac.png'
        style_background_color = '#412378'
        border_bottom = '0px solid'

    html_message = ('<div style="font-family: sans-serif; text-align:center; border: 1px solid #412378; margin-top: 30px;max-width: 550px;margin: 0 auto;">' +
            '<div style="background-color: '+style_background_color+';border-bottom:'+border_bottom+'; padding:5px;">' +
                '<img src="'+imgTitle+'"/>' +
            '</div>' +
            '<div style="padding:20px; font-size:16px;">' +
                content +
            '</div>' +
            '<div>' +
                '<p>© Melmac DMS by @Saroa SAS 2023</p>' +
            '</div>' +
        '</div>'
    )
    from_email = settings.EMAIL_HOST_USER
    if public:
        send_mail(
            subject=subject,
            message='',
            html_message=html_message,
            from_email=from_email,
            recipient_list=recipient_list
        )
    else:
        text_content = ''
        for to in recipient_list:
            msg = EmailMultiAlternatives(subject, text_content, from_email, [str(to).strip()])
            msg.attach_alternative(html_message, "text/html")
            msg.send()

def create_qr(content, path):
    try:
        img = qrcode.make(content)
        # type(img)  # qrcode.image.pil.PilImage
        img.save(path)
    except Exception as err:
        register_log(
            {
                'action': 'Crear QR',
                'type': 5,
                'source': 1,
                'url': 'INTERNO',
                'data': 'content: {}, path: {}'.format( content, path),
                'response_data': 'Excepcion Capturada {} - {} - {}'.format(type(err), str(err.args), traceback.format_exception_only(type(err), err)),
            }, None)
        return False

WS_TOKEN = ''

def send_whatsapp_msg(to, ent_name, doc_name, link, extra=' '):
    global WS_TOKEN
    count = 0
    while True:
        if WS_TOKEN == '':
            WS_TOKEN = Variable_Plataform.objects.get(id=4).value

        msg = {
            "name": "compartir_documento",
            "language": {
                "code": "ES"
            },
            "components": [
                {
                "type": "header",
                "parameters": [
                    {
                    "type": "text",
                    "text": str(ent_name).capitalize()
                    }
                ]
                },
                {
                "type": "body",
                "parameters": [
                    {
                    "type": "text",
                    "text": str(doc_name).capitalize()
                    },
                    {
                    "type": "text",
                    "text": str(link)
                    },
                    {
                    "type": "text",
                    "text": extra

                    }
                ]
                }
            ]
        }
        data = json.dumps({
            "messaging_product": "whatsapp",
            "to": "57"+str(to),
            "type": "template",
            'template' : msg,
        })

        r = requests.post("https://graph.facebook.com/v13.0/108061171967836/messages", data, headers={
            'Authorization': 'Bearer ' + str(WS_TOKEN),
            'Content-Type': 'application/json'
        })
        response = json.loads(r.text)
        print(response)
        if r.status_code != 200:
            count += 1
            if response['error']['code'] == 190:
                WS_TOKEN = ''
        else:
            return True
        if count == 3:
            break
    return False

def send_whatsapp_msg_v2(to, ent_name, doc_name, link, ent_name_2,img):
    global WS_TOKEN
    count = 0
    while True:
        if WS_TOKEN == '':
            WS_TOKEN = Variable_Plataform.objects.get(id=4).value

        msg = {
                "name": "compartir_documento_2",
                "language": {
                    "code": "ES"
                },
                "components": [
                    {
                    "type": "header",
                    "parameters": [
                        {
                            "type": "image",
                            "image": {
                            "link": str(img)
                            }
                        }
                    ]
                    },
                    {
                    "type": "body",
                    "parameters": [
                        {
                        "type": "text",
                        "text": str(ent_name).upper()
                        },
                        {
                        "type": "text",
                        "text": str(doc_name)
                        },
                        {
                        "type": "text",
                        "text": str(link)
                        },
                        {
                        "type": "text",
                        "text": str(ent_name_2).upper()
                        }
                    ]
                    }
                ]
            }

        data = json.dumps({
            "messaging_product": "whatsapp",
            "to": "57"+str(to),
            "type": "template",
            'template' : msg,
        })

        r = requests.post("https://graph.facebook.com/v13.0/108061171967836/messages", data, headers={
            'Authorization': 'Bearer ' + str(WS_TOKEN),
            'Content-Type': 'application/json'
        })
        response = json.loads(r.text)
        print(response)
        if r.status_code != 200:
            count += 1
            if response['error']['code'] == 190:
                WS_TOKEN = ''
        else:
            return True
        if count == 3:
            break
    return False

def send_whatsapp_msg_token_v2(to, token,ent_name):
    global WS_TOKEN
    count = 0
    while True:
        if WS_TOKEN == '':
            WS_TOKEN = Variable_Plataform.objects.get(id=4).value

        msg = {
            "name": "send_token_v2",
            "language": {
                "code": "ES"
            },
            "components": [
                {
                "type": "header",
                "parameters": [
                    {
                    "type": "text",
                    "text": str(ent_name).capitalize()
                    }
                ]
                },
                {
                "type": "body",
                "parameters": [
                    {
                    "type": "text",
                    "text": str(token)
                    },
                    {
                    "type": "text",
                    "text": str(ent_name).capitalize()
                    }
                ]
                }
            ]
        }

        data = json.dumps({
            "messaging_product": "whatsapp",
            "to": "57"+str(to),
            "type": "template",
            'template' : msg,
        })

        r = requests.post("https://graph.facebook.com/v13.0/108061171967836/messages", data, headers={
            'Authorization': 'Bearer ' + str(WS_TOKEN),
            'Content-Type': 'application/json'
        })
        response = json.loads(r.text)
        print(response)
        if r.status_code != 200:
            count += 1
            if response['error']['code'] == 190:
                WS_TOKEN = ''
        else:
            return True
        if count == 3:
            break
    return False


def send_whatsapp_msg_token(to, token):
    global WS_TOKEN
    count = 0
    while True:
        if WS_TOKEN == '':
            WS_TOKEN = Variable_Plataform.objects.get(id=4).value

        msg = {
            "name": "send_token",
            "language": {
                "code": "ES"
            },
            "components": [
                {
                "type": "body",
                "parameters": [
                    {
                    "type": "text",
                    "text": str(token)
                    },
                ]
                }
            ]
        }
        data = json.dumps({
            "messaging_product": "whatsapp",
            "to": "57"+str(to),
            "type": "template",
            'template' : msg,
        })

        r = requests.post("https://graph.facebook.com/v13.0/108061171967836/messages", data, headers={
            'Authorization': 'Bearer ' + str(WS_TOKEN),
            'Content-Type': 'application/json'
        })
        response = json.loads(r.text)
        print(response)
        if r.status_code != 200:
            count += 1
            if response['error']['code'] == 190:
                WS_TOKEN = ''
        else:
            return True
        if count == 3:
            break
    return False

from pyhanko.sign import signers
from pyhanko.pdf_utils.incremental_writer import IncrementalPdfFileWriter

is_windows = sys.platform.startswith('win')
if is_windows:
    CERT_PATH = 'C:/Users/josec/OneDrive/Documentos/Trabajo/Proyectos/melmac/backend/api/lib/cert.crt'
    KEY_PATH = 'C:/Users/josec/OneDrive/Documentos/Trabajo/Proyectos/melmac/backend/api/lib/llave.key'
else:
    CERT_PATH = '/home/saroa/melmac/backend/api/lib/cert.crt'
    KEY_PATH = '/home/saroa/melmac/backend/api/lib/llave.key'

class EcciSigner():
    def sign_doc(self, doc_path):
        try:
            cms_signer = signers.SimpleSigner.load(
                KEY_PATH, CERT_PATH,
            )
            out = None
            with open(doc_path, 'rb') as doc:
                w = IncrementalPdfFileWriter(doc)
                out = signers.sign_pdf(
                    w, signers.PdfSignatureMetadata(field_name='Saroa-ECCI', md_algorithm='md5',
                    location="Bogotá, Colombia",
                    reason="Digital Signature, Sign CRL, Sign Certificate (CA)",
                    name=("Fernando Arturo Soler López - UNIVERSIDAD ECCI"),
                    ),
                    signer=cms_signer,
                )
            if (out):
                with open(doc_path, 'wb+') as d:
                    d.write(out.read())
                return True
        except Exception as err:
            register_log(
            {
                'action': 'Firma ECCI',
                'type': 5,
                'source': 1,
                'url': 'INTERNO',
                'data': 'file: {}'.format(doc_path),
                'response_data': 'Excepcion Capturada {} - {} - {}'.format(type(err), str(err.args), traceback.format_exception_only(type(err), err)),
            }, None, 11)
        return False

if is_windows:
    CERT_GSE_PATH = 'C:/Users/josec/OneDrive/Documentos/Trabajo/Proyectos/melmac/backend/api/lib/cert_saroa.crt'
    KEY_GSE_PATH = 'C:/Users/josec/OneDrive/Documentos/Trabajo/Proyectos/melmac/backend/api/lib/llave_saroa.key'
else:
    CERT_GSE_PATH = '/home/saroa/melmac/backend/api/lib/cert_saroa.crt'
    KEY_GSE_PATH = '/home/saroa/melmac/backend/api/lib/llave_saroa.key'

class GSESigner():
    def sign_doc(self, doc_path, final_path):
        try:
            cms_signer = signers.SimpleSigner.load(
                KEY_GSE_PATH, CERT_GSE_PATH,
            )
            out = None
            with open(doc_path, 'rb') as doc:
                w = IncrementalPdfFileWriter(doc)
                out = signers.sign_pdf(
                    w, signers.PdfSignatureMetadata(field_name='Firma Digital-Saroa', md_algorithm='md5',
                    location="Bogotá, Colombia",
                    reason="Digital Signature, Sign CRL, Sign Certificate (CA)",
                    name=("GSE"),
                    ),
                    signer=cms_signer,
                )
            if (out):
                with open(final_path, 'wb+') as d:
                    d.write(out.read())
                return True
        except Exception as err:
            register_log(
            {
                'action': 'Firma GSE',
                'type': 5,
                'source': 1,
                'url': 'INTERNO',
                'data': 'file: {}'.format(doc_path),
                'response_data': 'Excepcion Capturada {} - {} - {}'.format(type(err), str(err.args), traceback.format_exception_only(type(err), err)),
            }, None, 11)
        return False

class ExcelFormater():

    def format_data(self, data, columns,formatDate):
        answers = []
        try:
            for answer in data:
                max_rows = 1
                table_rows = [len(ans['answer']['body']) for ans in answer[7:] if ans['type'] == 17]
                if table_rows:
                    max_rows = max([1] + table_rows)
                # print(answer[1]['answer'])
                for i in range(0,max_rows):
                    #formato de fecha
                    date = str(answer[1]).split(" ")
                    hourF = date[1]
                    dateS = str(answer[2]).split(" ")
                    hourSF = dateS[1]
                    if formatDate == "2":
                        dateF=date[0].split("-")
                        dataF=dateF[2]+"-"+dateF[1]+"-"+dateF[0]
                        dateSF=dateS[0].split("-")
                        dataSF=dateSF[2]+"-"+dateSF[1]+"-"+dateSF[0]
                    else:
                        dataF=date[0]
                        dataSF=dateS[0]

                    # dateS = ['Inmediata', 'Inmediata']
                    # if answer[2] != '':
                        #dateS = str(answer[2]).split(" ")

                    temp_answer = [answer[0],dataSF,hourSF,dataF,hourF,answer[3],answer[4],answer[5],answer[6] if i==0 else '',]
                    for col in columns:
                        temp_value = ''
                        for ans in answer[7:]:
                            if col[0] == ans['id']:
                                if ans['type'] == 11 or ans['type'] == 15 or ans['type'] == 23:
                                    if col[1] == ans['name']:
                                        temp_value = ans['answer']
                                elif ans['type'] == 17:
                                    try:
                                        for ans_col in ans['answer']['body'][i]:
                                            if str(ans_col['field']) == str(col[2]):
                                                temp_value = ans_col['answer']
                                                break
                                    except IndexError:
                                        pass
                                else:
                                    if i == 0:
                                        temp_value = ans['answer']
                        temp_answer.append(temp_value)

                    answers.append(temp_answer)

        except KeyError as err:
            print("EXCEL FORMATTER:::::::::::::::::::::::::::::::::::::", err)
            register_log(
            {
                'action': 'Preparación de datos a Excel',
                'type': 5,
                'source': 1,
                'url': 'INTERNO',
                'data': 'ids: {}'.format(set([answer[0] for answer in data])),
                'response_data': 'Excepcion Capturada {} - {} - {}'.format(type(err), str(err.args), traceback.format_exception_only(type(err), err)),
            }, None)
        return answers, ['#', 'Fecha Diligenciamiento', 'Hora Diligenciamiento', 'Fecha Envío', 'Hora Envío', 'Nombre Usuario', 'Documento Usuario', 'Latitud', 'Longitud'] + [col[1] for col in columns]

months = {
    'ENE': '01',
    'FEB': '02',
    'MAR': '03',
    'ABR': '04',
    'MAY': '05',
    'JUN': '06',
    'JUL': '07',
    'AGO': '08',
    'SEP': '09',
    'OCT': '10',
    'NOV': '11',
    'DIC': '12',
}
def convert_to_readable_date(date_text):
    parts = date_text.split('-')
    parts[1] = months[parts[1]]
    return '-'.join(parts)