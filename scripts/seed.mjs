import db from '../src/lib/db.js';

console.log('--- Initializing Database ---');

const schema = `
  -- 1. Maestros
  CREATE TABLE IF NOT EXISTS Proveedores (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Codigo TEXT, 
    Nombre_Fantasia TEXT NOT NULL,
    Razon_Social TEXT,
    CUIT TEXT, 
    Condicion_IVA TEXT,
    Ingresos_Brutos TEXT,
    Condicion_IIBB TEXT,
    Agente_Retencion INTEGER DEFAULT 0,
    Categoria_Principal TEXT,
    Dias_Entrega TEXT,
    Lead_Time INTEGER DEFAULT 1, 
    Pedido_Minimo REAL DEFAULT 0,
    Rating_Cumplimiento REAL DEFAULT 5.0,
    Rating_Calidad REAL DEFAULT 5.0,
    Condicion_Pago TEXT DEFAULT '30 Dias FF', 
    CBU TEXT,
    Alias TEXT,
    Banco TEXT,
    Nombre_Vendedor TEXT,
    Telefono_Pedidos TEXT,
    Email_Pedidos TEXT,
    Email_Administracion TEXT
  );

  CREATE TABLE IF NOT EXISTS Usuarios (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre TEXT NOT NULL,
    Email TEXT UNIQUE,
    Rol TEXT NOT NULL, -- 'Admin', 'Colaborador'
    Puesto TEXT, -- 'Gerente de Compras', 'Cajero'
    Avatar TEXT -- Initials or URL
  );

  CREATE TABLE IF NOT EXISTS Rubros (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre TEXT NOT NULL UNIQUE
  );

  CREATE TABLE IF NOT EXISTS Subrubros (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_Rubro INTEGER,
    Nombre TEXT NOT NULL,
    FOREIGN KEY(ID_Rubro) REFERENCES Rubros(ID)
  );

  CREATE TABLE IF NOT EXISTS Insumos (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Codigo TEXT, 
    Nombre TEXT NOT NULL,
    ID_Rubro INTEGER,
    ID_Subrubro INTEGER,
    Unidad_Compra TEXT,
    Contenido_Neto REAL DEFAULT 1,
    Unidad_Stock TEXT,
    Unidad_Uso TEXT,
    Factor_Conversion REAL DEFAULT 1.0,
    Factor_Rendimiento REAL DEFAULT 100.0,
    Alicuota_IVA REAL DEFAULT 21.0,
    Stock_Minimo REAL,
    Stock_Maximo REAL,
    Ubicacion_Deposito TEXT,
    FOREIGN KEY(ID_Rubro) REFERENCES Rubros(ID),
    FOREIGN KEY(ID_Subrubro) REFERENCES Subrubros(ID)
  );

  CREATE TABLE IF NOT EXISTS Platos (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Nombre TEXT NOT NULL,
    Precio_Venta REAL,
    Costo_Teorico_Actual REAL DEFAULT 0 
  );

  CREATE TABLE IF NOT EXISTS Fichas_Tecnicas (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_Plato INTEGER,
    ID_Insumo INTEGER,
    Cantidad_Teorica_Por_Plato REAL, 
    FOREIGN KEY(ID_Plato) REFERENCES Platos(ID),
    FOREIGN KEY(ID_Insumo) REFERENCES Insumos(ID)
  );

  CREATE TABLE IF NOT EXISTS Lista_Precios_Pactados (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_Proveedor INTEGER,
    ID_Insumo INTEGER,
    Precio_Pactado REAL, 
    Fecha_Vigencia_Desde TEXT,
    Fecha_Vigencia_Hasta TEXT,
    FOREIGN KEY(ID_Proveedor) REFERENCES Proveedores(ID),
    FOREIGN KEY(ID_Insumo) REFERENCES Insumos(ID)
  );

  -- 2. Transacciones
  CREATE TABLE IF NOT EXISTS Ordenes_Compra (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    Nro_OC TEXT UNIQUE, 
    ID_Proveedor INTEGER,
    ID_Usuario_Solicitante INTEGER,
    ID_Usuario_Aprobador INTEGER,
    Sucursal_Destino TEXT,
    Estado TEXT CHECK(Estado IN ('Borrador', 'Pendiente_Aprobacion', 'Enviada', 'Recepcionada_Parcial', 'Cerrada', 'Cancelada')), 
    Fecha_Emision TEXT,
    Fecha_Requerida_Entrega TEXT,
    Total_Estimado REAL DEFAULT 0, 
    Comentarios TEXT, 
    FOREIGN KEY(ID_Proveedor) REFERENCES Proveedores(ID)
  );

  CREATE TABLE IF NOT EXISTS Detalle_OC (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_OC INTEGER,
    ID_Insumo INTEGER,
    Cantidad_Solicitada REAL, 
    Unidad_Compra TEXT, 
    Precio_Unitario_Pactado REAL, 
    Subtotal_Linea REAL, 
    FOREIGN KEY(ID_OC) REFERENCES Ordenes_Compra(ID),
    FOREIGN KEY(ID_Insumo) REFERENCES Insumos(ID)
  );

  CREATE TABLE IF NOT EXISTS Recepcion_Mercaderia (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_OC_Referencia INTEGER,
    ID_Proveedor INTEGER,
    Numero_Remito TEXT,
    Fecha_Real_Recepcion TEXT,
    Temperatura_Ingreso REAL,
    Chofer TEXT,
    Patente TEXT,
    ID_Usuario_Recepcion INTEGER, -- New V8
    Estado_Global TEXT DEFAULT 'Aceptado', -- New V8: Aceptado, Rechazado, Condicional
    FOREIGN KEY(ID_OC_Referencia) REFERENCES Ordenes_Compra(ID)
  );

  CREATE TABLE IF NOT EXISTS Detalle_Recepcion (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_Recepcion INTEGER,
    ID_Insumo INTEGER,
    Cantidad_Recibida REAL, 
    Cantidad_Rechazada REAL DEFAULT 0,
    Motivo_Rechazo TEXT,
    Estado_Envases TEXT DEFAULT 'Integro', -- New V8
    Lote TEXT,
    Vencimiento TEXT,
    FOREIGN KEY(ID_Recepcion) REFERENCES Recepcion_Mercaderia(ID),
    FOREIGN KEY(ID_Insumo) REFERENCES Insumos(ID)
  );

  CREATE TABLE IF NOT EXISTS Facturas (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_Proveedor INTEGER,
    ID_Recepcion_Referencia INTEGER, 
    Tipo_Comprobante TEXT,
    Punto_Venta INTEGER,
    Numero_Comprobante INTEGER,
    CAE TEXT,
    Fecha_Emision TEXT,
    Fecha_Vencimiento_Pago TEXT,
    Neto_Gravado REAL DEFAULT 0,
    IVA_21 REAL DEFAULT 0,
    IVA_10_5 REAL DEFAULT 0,
    IVA_27 REAL DEFAULT 0, -- New V9
    Percepciones_IIBB REAL DEFAULT 0,
    Total_Facturado REAL,
    Estado_Pago TEXT DEFAULT 'Pendiente',
    FOREIGN KEY(ID_Recepcion_Referencia) REFERENCES Recepcion_Mercaderia(ID)
  );
  
  CREATE TABLE IF NOT EXISTS Detalle_Factura (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_Factura INTEGER,
    ID_Insumo INTEGER,
    Cantidad_Facturada REAL,
    Precio_Unitario_Facturado REAL,
    Alicuota_Aplicada REAL,
    FOREIGN KEY(ID_Factura) REFERENCES Facturas(ID),
    FOREIGN KEY(ID_Insumo) REFERENCES Insumos(ID)
  );

    -- V3: RECIPES & PRODUCTION
    CREATE TABLE IF NOT EXISTS Recetas (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Nombre_Plato TEXT,
        Descripcion TEXT,
        Precio_Venta_Actual REAL,
        Margen_Objetivo_Pct REAL DEFAULT 30.0,
        Costo_Teorico_Actual REAL, 
        Ultima_Actualizacion DATE
    );

    CREATE TABLE IF NOT EXISTS Detalle_Receta (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        ID_Receta INTEGER,
        ID_Insumo INTEGER,
        Cantidad_Bruta REAL,
        Unidad_Uso TEXT, 
        Costo_Calculado REAL,
        FOREIGN KEY(ID_Receta) REFERENCES Recetas(ID),
        FOREIGN KEY(ID_Insumo) REFERENCES Insumos(ID)
    );

    -- V3: SALES INT
    CREATE TABLE IF NOT EXISTS Ventas_Cabecera (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        Fecha DATETIME DEFAULT CURRENT_TIMESTAMP,
        Total REAL,
        Metodo_Pago TEXT
    );

    CREATE TABLE IF NOT EXISTS Ventas_Detalle (
        ID INTEGER PRIMARY KEY AUTOINCREMENT,
        ID_Venta INTEGER,
        ID_Receta INTEGER,
        Cantidad INTEGER,
        Precio_Unitario REAL,
        FOREIGN KEY(ID_Venta) REFERENCES Ventas_Cabecera(ID),
        FOREIGN KEY(ID_Receta) REFERENCES Recetas(ID)
    );

  CREATE TABLE IF NOT EXISTS Ventas_POS (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_Plato INTEGER,
    Cantidad_Vendida INTEGER,
    Fecha TEXT,
    FOREIGN KEY(ID_Plato) REFERENCES Platos(ID)
  );
  
  CREATE TABLE IF NOT EXISTS Insumo_Valuacion (
    ID_Insumo INTEGER PRIMARY KEY,
    Stock_Actual REAL DEFAULT 0,
    Costo_Promedio_Ponderado REAL DEFAULT 0,
    FOREIGN KEY(ID_Insumo) REFERENCES Insumos(ID)
  );

  CREATE TABLE IF NOT EXISTS Movimientos_Stock (
    ID INTEGER PRIMARY KEY AUTOINCREMENT,
    ID_Insumo INTEGER,
    Tipo_Movimiento TEXT, -- 'Recepcion', 'Venta', 'Ajuste', 'Consumo_Receta'
    Cantidad REAL,
    Fecha TEXT DEFAULT (datetime('now')),
    Referencia TEXT, -- e.g. "Recepcion #123"
    FOREIGN KEY(ID_Insumo) REFERENCES Insumos(ID)
  );
`;

(async () => {
  try {
    console.log('--- Reseting Database ---');

    // 1. Drop old tables
    const tablesToDrop = [
      'Ventas_Detalle', 'Ventas_Cabecera', 'Detalle_Receta', 'Recetas',
      'Detalle_Factura', 'Facturas', 'Detalle_Recepcion', 'Recepcion_Mercaderia',
      'Detalle_OC', 'Ordenes_Compra', 'Lista_Precios_Pactados',
      'Insumo_Valuacion', 'Fichas_Tecnicas', 'Ventas_POS', 'Platos', 'Insumos', 'Subrubros', 'Rubros', 'Proveedores', 'Usuarios'
    ];

    for (const t of tablesToDrop) {
      await db.exec(`DROP TABLE IF EXISTS ${t}`);
    }
    console.log('Old tables dropped.');

    // 2. Apply New Schema
    await db.exec(schema);
    console.log('Schema Applied.');

    // 3. Seed Data
    const transaction = db.transaction(async () => {

      // --- USUARIOS ---
      const insertUsuario = db.prepare(`
        INSERT INTO Usuarios (Nombre, Email, Rol, Puesto, Avatar)
        VALUES (?, ?, ?, ?, ?)
      `);

      await insertUsuario.run('Ana Garcia', 'ana.garcia@empresa.com', 'Admin', 'Gerenta RRHH', 'AG');
      await insertUsuario.run('Carlos Diaz', 'carlos.diaz@empresa.com', 'Colaborador', 'Cajero', 'CD');

      // --- PROVEEDORES V5 ---
      const insertProv = db.prepare(`
        INSERT INTO Proveedores (
            Codigo, Nombre_Fantasia, Razon_Social, 
            CUIT, Condicion_IVA, Ingresos_Brutos, Condicion_IIBB, Agente_Retencion,
            Categoria_Principal, Dias_Entrega, Lead_Time, Pedido_Minimo,
            Condicion_Pago, CBU, Alias, Banco,
            Nombre_Vendedor, Telefono_Pedidos, Email_Pedidos
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const pSur = (await insertProv.run(
        'PRV-001', 'Carnes del Sur', 'Carnes del Sur SA',
        '30-71112223-9', 'Resp. Inscripto', '901-123456-1', 'Local', 1,
        'Carniceria', 'Lun,Mie,Vie', 2, 50000,
        '30 Dias FF', '0720000720000000111222', 'CARNES.SUR.PAGO', 'Banco Santander',
        'Roberto Gonzalez', '+5491155556666', 'pedidos@carnesdelsur.com'
      )).lastInsertRowid;

      const pCentral = (await insertProv.run(
        'PRV-002', 'Distribuidora Central', 'Distribuidora Central SRL',
        '30-55555555-1', 'Resp. Inscripto', '901-987654-3', 'Local', 0,
        'Almacen', 'Mar,Jue', 1, 20000,
        '15 Dias FF', '0140000001111111222333', 'DISTRI.CENTRAL', 'Banco Provincia',
        'Maria Rodriguez', '+5491144448888', 'ventas@districentral.com'
      )).lastInsertRowid;

      const pCafe = (await insertProv.run(
        'PRV-003', 'Café Import', 'Café Importadores SA',
        '33-99999999-9', 'Resp. Inscripto', '902-111222-3', 'Local', 1,
        'Cafeteria', 'Vie', 5, 100000,
        '30 Dias FF', '1230000123000000999888', 'CAFE.IMPORT.ARG', 'Banco Galicia',
        'Carlos Cafe', '+5491133332222', 'pedidos@cafeimport.com'
      )).lastInsertRowid;

      // --- RUBROS & SUBRUBROS ---
      const insertRubro = db.prepare('INSERT INTO Rubros (Nombre) VALUES (?)');
      const rCarne = (await insertRubro.run('Carnicería')).lastInsertRowid;
      const rSecos = (await insertRubro.run('Secos y Almacén')).lastInsertRowid;
      const rBebidas = (await insertRubro.run('Bebidas')).lastInsertRowid;

      const insertSub = db.prepare('INSERT INTO Subrubros (ID_Rubro, Nombre) VALUES (?, ?)');
      const sRes = (await insertSub.run('Res', rCarne)).lastInsertRowid;
      const sPesca = (await insertSub.run('Pescados', rCarne)).lastInsertRowid;
      const sGranos = (await insertSub.run('Granos', rSecos)).lastInsertRowid;

      // --- INSUMOS V6 ---
      const insertInsumo = db.prepare(`
            INSERT INTO Insumos (
                Codigo, Nombre, ID_Rubro, ID_Subrubro, 
                Unidad_Compra, Contenido_Neto, Unidad_Stock, Unidad_Uso, Factor_Conversion,
                Factor_Rendimiento, Alicuota_IVA, 
                Stock_Minimo, Stock_Maximo, Ubicacion_Deposito
            ) 
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
          `);

      // 1. Meat: Lomo.
      await insertInsumo.run(
        'CAR-001', 'Lomo Vetado', rCarne, sRes,
        'Caja', 20, 'Kg', 'Kg', 1,
        85.0, 10.5,
        5, 20, 'Cámara Carnes'
      );

      // 2. Salmon.
      await insertInsumo.run(
        'PES-001', 'Salmón Premium', rCarne, sPesca,
        'Pieza', 4.5, 'Kg', 'Kg', 1,
        90.0, 10.5,
        10, 30, 'Cámara Pescados'
      );

      // 3. Alcohol: Fernet.
      await insertInsumo.run(
        'BEB-001', 'Fernet Branca 750ml', rBebidas, null,
        'Caja', 6, 'Botella', 'Ml', 750,
        100.0, 21.0,
        12, 48, 'Depósito Barra'
      );

      // 4. Dry: Coffee.
      await insertInsumo.run(
        'SEC-001', 'Café Grano Colombia', rSecos, sGranos,
        'Bolsa', 1, 'Kg', 'Gr', 1000,
        100.0, 21.0,
        5, 20, 'Depósito Seco'
      );

      // 5. Coca Cola
      await insertInsumo.run(
        'BEB-002', 'Coca Cola 2.25L', rBebidas, null,
        'Pack', 8, 'Botella', 'Lt', 2250,
        100.0, 21.0,
        10, 50, 'Depósito Barra'
      );

      const iLomo = (await db.prepare("SELECT ID FROM Insumos WHERE Codigo = 'CAR-001'").get()).ID;
      const iSalmon = (await db.prepare("SELECT ID FROM Insumos WHERE Codigo = 'PES-001'").get()).ID;
      const iCafe = (await db.prepare("SELECT ID FROM Insumos WHERE Codigo = 'SEC-001'").get()).ID;
      const iFernet = (await db.prepare("SELECT ID FROM Insumos WHERE Codigo = 'BEB-001'").get()).ID;
      const iCoca = (await db.prepare("SELECT ID FROM Insumos WHERE Codigo = 'BEB-002'").get()).ID;

      // --- PRECIOS PACTADOS ---
      const insertPrecio = db.prepare('INSERT INTO Lista_Precios_Pactados (ID_Proveedor, ID_Insumo, Precio_Pactado, Fecha_Vigencia_Desde, Fecha_Vigencia_Hasta) VALUES (?, ?, ?, ?, ?)');
      await insertPrecio.run(pSur, iLomo, 200000, '2023-01-01', '2023-12-31');
      await insertPrecio.run(pCentral, iSalmon, 75000, '2023-01-01', '2023-12-31');
      await insertPrecio.run(pCafe, iCafe, 18000, '2023-01-01', '2023-12-31');
      await insertPrecio.run(pSur, iCoca, 16000, '2023-01-01', '2023-12-31');

      // --- PLATOS & FICHAS ---
      const insertPlato = db.prepare('INSERT INTO Platos (Nombre, Precio_Venta) VALUES (?, ?)');
      const plBife = (await insertPlato.run('Bife Chorizo', 16000)).lastInsertRowid;
      const plSalmon = (await insertPlato.run('Salmón Grill', 19000)).lastInsertRowid;

      const insertFicha = db.prepare('INSERT INTO Fichas_Tecnicas (ID_Plato, ID_Insumo, Cantidad_Teorica_Por_Plato) VALUES (?, ?, ?)');
      await insertFicha.run(plBife, iLomo, 0.350);
      await insertFicha.run(plSalmon, iSalmon, 0.250);

      // --- FLUJO DE COMPRA V7 (OC) ---
      const insertOC = db.prepare(`
        INSERT INTO Ordenes_Compra (
            Nro_OC, ID_Proveedor, ID_Usuario_Solicitante, ID_Usuario_Aprobador, Sucursal_Destino,
            Estado, Fecha_Emision, Fecha_Requerida_Entrega, Total_Estimado, Comentarios
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);

      const insertDetOC = db.prepare('INSERT INTO Detalle_OC (ID_OC, ID_Insumo, Cantidad_Solicitada, Unidad_Compra, Precio_Unitario_Pactado, Subtotal_Linea) VALUES (?, ?, ?, ?, ?, ?)');

      const oc1 = (await insertOC.run(
        'OC-2023-001', pSur, 1, 2, 'Sucursal Central',
        'Enviada', '2023-10-01', '2023-10-04',
        1000000, 'Entrega urgente por evento fin de semana'
      )).lastInsertRowid;

      await insertDetOC.run(oc1, iLomo, 5, 'Caja 20kg', 200000, 1000000);

      // 2. Recepción (Remito)
      const insertRec = db.prepare('INSERT INTO Recepcion_Mercaderia (ID_OC_Referencia, ID_Proveedor, Numero_Remito, Fecha_Real_Recepcion, Temperatura_Ingreso, ID_Usuario_Recepcion, Estado_Global) VALUES (?, ?, ?, ?, ?, ?, ?)');
      const insertDetRec = db.prepare('INSERT INTO Detalle_Recepcion (ID_Recepcion, ID_Insumo, Cantidad_Recibida, Lote, Vencimiento, Estado_Envases) VALUES (?, ?, ?, ?, ?, ?)');

      const rec1 = (await insertRec.run(oc1, pSur, 'R-001-9988', '2023-10-04', 4.5, 1, 'Aceptado')).lastInsertRowid;
      await insertDetRec.run(rec1, iLomo, 5, 'LOTE-A100', '2023-12-01', 'Integro');

      // 3. Factura
      const insertFac = db.prepare(`
        INSERT INTO Facturas (ID_Proveedor, ID_Recepcion_Referencia, Tipo_Comprobante, Punto_Venta, Numero_Comprobante, Fecha_Emision, Neto_Gravado, IVA_10_5, IVA_27, Total_Facturado) 
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0, ?)
      `);
      const insertDetFac = db.prepare('INSERT INTO Detalle_Factura (ID_Factura, ID_Insumo, Cantidad_Facturada, Precio_Unitario_Facturado) VALUES (?, ?, ?, ?)');

      const fac1 = (await insertFac.run(pSur, rec1, 'A', 1, 5555, '2023-10-04', 1050000, 110250, 1160250)).lastInsertRowid;
      await insertDetFac.run(fac1, iLomo, 5, 210000);

      // --- VALUACION PPP ---
      const insertVal = db.prepare('INSERT INTO Insumo_Valuacion (ID_Insumo, Stock_Actual, Costo_Promedio_Ponderado) VALUES (?, ?, ?)');
      await insertVal.run(iLomo, 47.5, 10500);

      // Movimiento Inicial (Simulado)
      const insertMov = db.prepare('INSERT INTO Movimientos_Stock (ID_Insumo, Tipo_Movimiento, Cantidad, Referencia, Fecha) VALUES (?, ?, ?, ?, ?)');
      await insertMov.run(iLomo, 'Recepcion', 47.5, 'Inicial Seed', '2023-10-01 10:00:00');

      console.log('Seeding Recipes...');
      // Mock Recipes
      const insertRecipe = db.prepare(`INSERT INTO Recetas (Nombre_Plato, Precio_Venta_Actual, Costo_Teorico_Actual) VALUES (?, ?, ?)`);
      const insertRecipeDet = db.prepare(`INSERT INTO Detalle_Receta (ID_Receta, ID_Insumo, Cantidad_Bruta, Unidad_Uso) VALUES (?, ?, ?, ?)`);

      // Recipe 1: Bife de Lomo 300g
      const r1 = (await insertRecipe.run('Bife de Lomo 300g', 18000, 3000)).lastInsertRowid;
      await insertRecipeDet.run(r1, iLomo, 0.3, 'Kg');

      // Recipe 2: Fernet con Coca
      const r2 = (await insertRecipe.run('Fernet con Coca', 6500, 800)).lastInsertRowid;
      await insertRecipeDet.run(r2, iFernet, 0.066667, 'Botella');
      await insertRecipeDet.run(r2, iCoca, 0.088889, 'Botella');

    });

    await transaction();
    console.log('Seeding V7 Complete.');
    console.log('Database seeded successfully!');
  } catch (err) {
    console.error("Seeding failed:", err);
  }
})();
