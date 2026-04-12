<?php

namespace Database\Seeders;

use App\Models\Category;
use App\Models\Item;
use App\Models\User;
use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\Hash;

class DatabaseSeeder extends Seeder
{
    public function run(): void
    {
        // Crear admin
        $admin = User::create([
            'name' => 'Administrador',
            'email' => 'admin@vecinosprestamos.com',
            'password' => Hash::make('admin123'),
            'role' => 'admin',
            'apartment' => 'Administración',
            'phone' => '3001234567',
            'is_active' => true,
        ]);

        // Crear categorías
        $categories = [
            ['name' => 'Herramientas', 'icon' => 'Wrench', 'description' => 'Taladros, destornilladores, martillos y herramientas de trabajo'],
            ['name' => 'Electrodomésticos', 'icon' => 'Zap', 'description' => 'Licuadoras, planchas, aspiradoras y similares'],
            ['name' => 'Deportes', 'icon' => 'Dumbbell', 'description' => 'Balones, raquetas, pesas e implementos deportivos'],
            ['name' => 'Cocina', 'icon' => 'ChefHat', 'description' => 'Ollas, sartenes, moldes y utensilios de cocina'],
            ['name' => 'Tecnología', 'icon' => 'Monitor', 'description' => 'Cables, cargadores, adaptadores y dispositivos'],
            ['name' => 'Jardín', 'icon' => 'TreePine', 'description' => 'Mangueras, podadoras y elementos de jardinería'],
            ['name' => 'Limpieza', 'icon' => 'SprayCanIcon', 'description' => 'Hidrolavadoras, aspiradoras industriales y similares'],
            ['name' => 'Otros', 'icon' => 'Package', 'description' => 'Objetos que no encajan en otra categoría'],
        ];

        foreach ($categories as $cat) {
            Category::create($cat);
        }

        // Crear residentes de ejemplo
        $residents = [
            ['name' => 'Carlos Rodríguez', 'email' => 'carlos@test.com', 'apartment' => 'Torre 1 Apto 201', 'phone' => '3101234567'],
            ['name' => 'María López', 'email' => 'maria@test.com', 'apartment' => 'Torre 2 Apto 305', 'phone' => '3159876543'],
            ['name' => 'Andrés García', 'email' => 'andres@test.com', 'apartment' => 'Torre 1 Apto 502', 'phone' => '3201112233'],
            ['name' => 'Laura Martínez', 'email' => 'laura@test.com', 'apartment' => 'Torre 3 Apto 101', 'phone' => '3004445566'],
        ];

        $users = [];
        foreach ($residents as $res) {
            $users[] = User::create([
                'name' => $res['name'],
                'email' => $res['email'],
                'password' => Hash::make('password'),
                'role' => 'resident',
                'apartment' => $res['apartment'],
                'phone' => $res['phone'],
                'is_active' => true,
            ]);
        }

        // Crear items de ejemplo
        $items = [
            ['user_id' => $users[0]->id, 'category_id' => 1, 'name' => 'Taladro Bosch', 'description' => 'Taladro percutor inalámbrico 18V con dos baterías. Incluye maletín con brocas.', 'condition' => 'bueno'],
            ['user_id' => $users[0]->id, 'category_id' => 1, 'name' => 'Escalera 6 peldaños', 'description' => 'Escalera de aluminio plegable. Soporta hasta 120kg.', 'condition' => 'bueno'],
            ['user_id' => $users[1]->id, 'category_id' => 2, 'name' => 'Aspiradora Karcher', 'description' => 'Aspiradora húmeda/seca de 1400W. Ideal para limpieza profunda.', 'condition' => 'nuevo'],
            ['user_id' => $users[1]->id, 'category_id' => 4, 'name' => 'Waflera Oster', 'description' => 'Waflera doble antiadherente. Hace waffles belgas gruesos.', 'condition' => 'bueno'],
            ['user_id' => $users[2]->id, 'category_id' => 3, 'name' => 'Balón de fútbol Adidas', 'description' => 'Balón oficial tamaño 5. Poco uso, en excelente estado.', 'condition' => 'nuevo'],
            ['user_id' => $users[2]->id, 'category_id' => 5, 'name' => 'Cable HDMI 3 metros', 'description' => 'Cable HDMI 2.1 de alta velocidad. Soporta 4K a 120Hz.', 'condition' => 'nuevo'],
            ['user_id' => $users[3]->id, 'category_id' => 6, 'name' => 'Manguera extensible 15m', 'description' => 'Manguera de jardín extensible con pistola de 7 funciones.', 'condition' => 'regular'],
            ['user_id' => $users[3]->id, 'category_id' => 7, 'name' => 'Hidrolavadora', 'description' => 'Hidrolavadora 1500 PSI. Perfecta para lavar carros y terrazas.', 'condition' => 'bueno'],
        ];

        foreach ($items as $itemData) {
            Item::create($itemData);
        }
    }
}
