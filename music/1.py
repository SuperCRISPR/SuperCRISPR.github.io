import os
import json
import tkinter as tk
from tkinter import ttk, messagebox
from pygame import mixer


# Step 1: Manage info.json
def manage_info_json():
    music_dir = './music'
    info_file = 'info.json'

    # 获取所有 .mp3 文件
    mp3_files = [f for f in os.listdir(music_dir) if f.endswith('.mp3')]

    # 读取 info.json 文件
    if os.path.exists(info_file):
        with open(info_file, 'r', encoding='utf-8') as f:
            info_data = json.load(f)
    else:
        info_data = {}

    # 更新 info.json 文件
    updated_info = {}

    for mp3_file in mp3_files:
        filepath = os.path.join(music_dir, mp3_file).replace("\\", "/")
        if filepath not in info_data:
            updated_info[filepath] = {
                "Filepath": filepath,
                "Title": "",
                "Subtitle": "",
                "Composer": "",
                "Number": "",
                "Time": "",
                "Form": "",
                "Instrument": "",
                "Performance": {"Version": ""}
            }
        else:
            updated_info[filepath] = info_data[filepath]

    # 删除不存在的文件信息
    keys_to_delete = [key for key in info_data if key not in updated_info]
    for key in keys_to_delete:
        del info_data[key]

    # 保存更新后的 info.json 文件
    with open(info_file, 'w', encoding='utf-8') as f:
        json.dump(updated_info, f, indent=4, ensure_ascii=False)


# Step 2: Create the GUI application
class MusicManagerApp:
    def __init__(self, root):
        self.root = root
        self.root.title("Music Manager")
        self.root.geometry("600x400")
        self.root.minsize(600, 400)
        self.current_index = 0
        self.load_data()
        if not self.mp3_files:
            messagebox.showerror("错误", "没有找到任何mp3文件")
            self.root.destroy()
            return

        self.create_widgets()
        self.update_fields()

    def load_data(self):
        self.music_dir = './music'
        self.info_file = 'info.json'

        with open(self.info_file, 'r', encoding='utf-8') as f:
            self.info_data = json.load(f)

        self.mp3_files = list(self.info_data.keys())

    def create_widgets(self):
        self.create_controls()
        self.create_fields()

    def create_controls(self):
        self.controls_frame = tk.Frame(self.root)
        self.controls_frame.pack(fill=tk.X, expand=True)

        self.prev_button = tk.Button(self.controls_frame, text="上一首", command=self.prev_song)
        self.prev_button.pack(side=tk.LEFT)

        self.play_button = tk.Button(self.controls_frame, text="播放/暂停", command=self.play_pause)
        self.play_button.pack(side=tk.LEFT)

        self.next_button = tk.Button(self.controls_frame, text="下一首", command=self.next_song)
        self.next_button.pack(side=tk.LEFT)

        self.modify_button = tk.Button(self.controls_frame, text="修改", command=self.save_info)
        self.modify_button.pack(side=tk.LEFT)

    def create_fields(self):
        self.fields_frame = tk.Frame(self.root)
        self.fields_frame.pack(fill=tk.X, expand=True)

        self.fields = {}
        labels = ["Filepath", "Title", "Subtitle", "Composer", "Number", "Time", "Instrument"]

        for label in labels:
            frame = tk.Frame(self.fields_frame)
            frame.pack(fill=tk.X)
            tk.Label(frame, text=label).pack(side=tk.LEFT)

            if label == "Filepath":
                entry = tk.Entry(frame, state='readonly')
            else:
                entry = tk.Entry(frame)
            entry.pack(side=tk.RIGHT, fill=tk.X, expand=True)
            self.fields[label] = entry

        form_frame = tk.Frame(self.fields_frame)
        form_frame.pack(fill=tk.X)
        tk.Label(form_frame, text="Form").pack(side=tk.LEFT)
        self.form_combobox = ttk.Combobox(form_frame, values=["Symphony", "Concerto", "Ensemble", "Solo", "Others"])
        self.form_combobox.pack(side=tk.RIGHT, fill=tk.X, expand=True)
        self.fields["Form"] = self.form_combobox

        self.performance_frame = tk.LabelFrame(self.fields_frame, text="Performance")
        self.performance_frame.pack(fill=tk.X)
        self.performance_entries = {}

    def update_fields(self):
        filepath = self.mp3_files[self.current_index]
        info = self.info_data[filepath]

        for key, entry in self.fields.items():
            if key == "Filepath":
                entry.config(state='normal')  # 解除只读状态
                entry.delete(0, tk.END)
                entry.insert(0, info.get(key, ""))
                entry.config(state='readonly')  # 重新设为只读
            elif key == "Form":
                entry.set(info.get(key, ""))
            else:
                entry.delete(0, tk.END)
                entry.insert(0, info.get(key, ""))

        self.update_performance_fields(info.get("Form", ""), info.get("Performance", {}))

    def update_performance_fields(self, form, performance):
        for widget in self.performance_frame.winfo_children():
            widget.destroy()
        self.performance_entries.clear()

        if form == "Symphony":
            labels = ["Conductor", "Orchestra"]
        elif form == "Concerto":
            labels = ["Conductor", "Orchestra"] + performance.get("Instrument", "").split(",")
        elif form == "Ensemble":
            labels = performance.get("Instrument", "").split(",")
        elif form == "Solo":
            labels = [performance.get("Instrument", "")]
        else:
            labels = []

        for label in labels:
            frame = tk.Frame(self.performance_frame)
            frame.pack(fill=tk.X)
            tk.Label(frame, text=label).pack(side=tk.LEFT)
            entry = tk.Entry(frame)
            entry.pack(side=tk.RIGHT, fill=tk.X, expand=True)
            entry.insert(0, performance.get(label, ""))
            self.performance_entries[label] = entry

        version_frame = tk.Frame(self.performance_frame)
        version_frame.pack(fill=tk.X)
        tk.Label(version_frame, text="Version").pack(side=tk.LEFT)
        version_entry = tk.Entry(version_frame)
        version_entry.pack(side=tk.RIGHT, fill=tk.X, expand=True)
        version_entry.insert(0, performance.get("Version", ""))
        self.performance_entries["Version"] = version_entry

    def prev_song(self):
        self.current_index = (self.current_index - 1) % len(self.mp3_files)
        self.update_fields()

    def next_song(self):
        self.current_index = (self.current_index + 1) % len(self.mp3_files)
        self.update_fields()

    def play_pause(self):
        if mixer.music.get_busy():
            mixer.music.pause()
        else:
            filepath = self.mp3_files[self.current_index]
            mixer.music.load(filepath)
            mixer.music.play()

    def save_info(self):
        filepath = self.mp3_files[self.current_index]
        info = self.info_data[filepath]

        for key, entry in self.fields.items():
            if key == "Form":
                info[key] = entry.get()
            else:
                info[key] = entry.get()

        performance_info = {}
        for label, entry in self.performance_entries.items():
            performance_info[label] = entry.get()

        info["Performance"] = performance_info

        with open(self.info_file, 'w', encoding='utf-8') as f:
            json.dump(self.info_data, f, indent=4, ensure_ascii=False)



if __name__ == "__main__":
    manage_info_json()
    mixer.init()
    root = tk.Tk()
    app = MusicManagerApp(root)
    root.mainloop()
